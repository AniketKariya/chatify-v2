const express = require('express');
const passport = require('passport');
const session = require("express-session");
const Contact = require("../models/contacts");
const mongoose = require("mongoose");
require("../passport-setup");
require('dotenv').config()

////////// DECLARATIONS //////////
const { google } = require("googleapis");
const UserContact = require("../models/user-contacts");
const router = express.Router();

////////// MIDDLEWARE //////////
const isLoggedIn = (req, res, next) => {
    if (req.user) {
        next();
    }
    else {
        res.sendStatus(401);
    }
}


////////// ROUTES //////////

const listContacts = (of, oAuth2Client, nextPageToken) => {
    const service = google.people({ version: 'v1', auth: oAuth2Client });

    if (nextPageToken) {
        service.people.connections.list({
            pageToken: nextPageToken,
            resourceName: 'people/me',
            pageSize: 100,
            personFields: 'names,emailAddresses,phoneNumbers',
            sortOrder: "FIRST_NAME_ASCENDING"
        }, (err, res) => connectionsCallback(err, res, of, oAuth2Client));
    } else {
        service.people.connections.list({
            resourceName: 'people/me',
            pageSize: 100,
            personFields: 'names,emailAddresses,phoneNumbers',
            sortOrder: "FIRST_NAME_ASCENDING",
        }, (err, res) => connectionsCallback(err, res, of, oAuth2Client));
    }
}

const connectionsCallback = async (err, res, of, oAuth2Client) => {
    if (err) {
        console.log(err)
        return
    }

    const connections = res.data.connections;
    const db = mongoose.connection;

    if (connections) {
        console.log('Connections:');
        connections.forEach(async (person) => {
            if (person.names && person.names.length > 0) {
                const name = person.names[0].displayName
                const number = person.phoneNumbers[0].canonicalForm;
                const contact = new Contact({ of, name, mobile_number: number })

                db.collection("users").findOne({mobile_number: number}, async (err, res) => {
                    if(err) {
                        console.log("error in finding contact from user", err)
                    }

                    if(res) {
                        console.log(res);
                        db.collection("user-contacts")
                            .findOneAndDelete({mobile_number: number, of}, (err, res) => {
                                if(err) {
                                    console.log(err);
                                }
                            })
                        
                        const userContact = new UserContact({of, name, mobile_number: number})
                        await userContact.save(err => {
                            if(err) {
                                console.log(err);
                            }
                        });
                    }
                })

                await contact.save()
            } else {
                console.log("No display name found for this record");
            }
        });
    }

    if (res.data.nextPageToken) {
        listContacts(of, oAuth2Client, res.data.nextPageToken);
    }
}

router.get("/success", (req, res) => {

    const oAuth2Client = new google.auth.OAuth2(process.env.GOOGLE_PEOPLE_CLIENT_ID,
        process.env.GOOGLE_PEOPLE_CLIENT_SECRET, process.env.GOOGLE_PEOPLE_REDIRECT)

    if (!req.session.accessToken) {
        return res.status(403).end();
    }

    const token = {
        access_token: req.session.accessToken,
        refresh_token: req.session.refreshToken,
    }

    const of = req.session.user.mobile_number;
    mongoose.connection.collection('contacts')
        .deleteMany({ of })
        .then(result => {
            console.log("contacts deleted: " + result);
        }).catch(error => {
            if (error) console.log("contact deletion error: " + error);
        })

    oAuth2Client.setCredentials(token);
    res.redirect("/");
    listContacts(of, oAuth2Client);
})

router.get('/auth/google',
    passport.authenticate('google', {
        scope: ['profile', 'email', 'https://www.googleapis.com/auth/contacts'],
        accessType: 'offline',
        prompt: 'consent',
    }));

router.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect home.
        // create new session to prevent session fixation attacks
        let prevSession = req.session;
        req.session.regenerate((err) => {
            Object.assign(req.session, prevSession);
            // res.redirect('/success');
        });

        res.redirect('/success');
    })

router.get("/getusers", async (req, res) => {
    const db = mongoose.connection;

    const users = await db.collection("user-contacts")
        .find({of: req.session.user.mobile_number})
        .toArray()

    res.send(users);
})

router.get("/logout", (req, res) => {
    req.session = null;
    req.logout();
    res.redirect("/");
})

module.exports = router;