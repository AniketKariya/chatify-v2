"use strict";

var express = require('express');

var passport = require('passport');

var session = require("express-session");

var Contact = require("../models/contacts");

var mongoose = require("mongoose");

require("../passport-setup");

require('dotenv').config(); ////////// DECLARATIONS //////////


var _require = require("googleapis"),
    google = _require.google;

var UserContact = require("../models/user-contacts");

var router = express.Router(); ////////// MIDDLEWARE //////////

var isLoggedIn = function isLoggedIn(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.sendStatus(401);
  }
}; ////////// ROUTES //////////


var listContacts = function listContacts(of, oAuth2Client, nextPageToken) {
  var service = google.people({
    version: 'v1',
    auth: oAuth2Client
  });

  if (nextPageToken) {
    service.people.connections.list({
      pageToken: nextPageToken,
      resourceName: 'people/me',
      pageSize: 100,
      personFields: 'names,emailAddresses,phoneNumbers',
      sortOrder: "FIRST_NAME_ASCENDING"
    }, function (err, res) {
      return connectionsCallback(err, res, of, oAuth2Client);
    });
  } else {
    service.people.connections.list({
      resourceName: 'people/me',
      pageSize: 100,
      personFields: 'names,emailAddresses,phoneNumbers',
      sortOrder: "FIRST_NAME_ASCENDING"
    }, function (err, res) {
      return connectionsCallback(err, res, of, oAuth2Client);
    });
  }
};

var connectionsCallback = function connectionsCallback(err, res, of, oAuth2Client) {
  var connections, db;
  return regeneratorRuntime.async(function connectionsCallback$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          if (!err) {
            _context3.next = 3;
            break;
          }

          console.log(err);
          return _context3.abrupt("return");

        case 3:
          connections = res.data.connections;
          db = mongoose.connection;

          if (connections) {
            console.log('Connections:');
            connections.forEach(function _callee2(person) {
              var name, number, contact;
              return regeneratorRuntime.async(function _callee2$(_context2) {
                while (1) {
                  switch (_context2.prev = _context2.next) {
                    case 0:
                      if (!(person.names && person.names.length > 0)) {
                        _context2.next = 9;
                        break;
                      }

                      name = person.names[0].displayName;
                      number = person.phoneNumbers[0].canonicalForm;
                      contact = new Contact({
                        of: of,
                        name: name,
                        mobile_number: number
                      });
                      db.collection("users").findOne({
                        mobile_number: number
                      }, function _callee(err, res) {
                        var userContact;
                        return regeneratorRuntime.async(function _callee$(_context) {
                          while (1) {
                            switch (_context.prev = _context.next) {
                              case 0:
                                if (err) {
                                  console.log("error in finding contact from user", err);
                                }

                                if (!res) {
                                  _context.next = 7;
                                  break;
                                }

                                console.log(res);
                                db.collection("user-contacts").findOneAndDelete({
                                  mobile_number: number,
                                  of: of
                                }, function (err, res) {
                                  if (err) {
                                    console.log(err);
                                  }
                                });
                                userContact = new UserContact({
                                  of: of,
                                  name: name,
                                  mobile_number: number
                                });
                                _context.next = 7;
                                return regeneratorRuntime.awrap(userContact.save(function (err) {
                                  if (err) {
                                    console.log(err);
                                  }
                                }));

                              case 7:
                              case "end":
                                return _context.stop();
                            }
                          }
                        });
                      });
                      _context2.next = 7;
                      return regeneratorRuntime.awrap(contact.save());

                    case 7:
                      _context2.next = 10;
                      break;

                    case 9:
                      console.log("No display name found for this record");

                    case 10:
                    case "end":
                      return _context2.stop();
                  }
                }
              });
            });
          }

          if (res.data.nextPageToken) {
            listContacts(of, oAuth2Client, res.data.nextPageToken);
          }

        case 7:
        case "end":
          return _context3.stop();
      }
    }
  });
};

router.get("/success", function (req, res) {
  var oAuth2Client = new google.auth.OAuth2(process.env.GOOGLE_PEOPLE_CLIENT_ID, process.env.GOOGLE_PEOPLE_CLIENT_SECRET, process.env.GOOGLE_PEOPLE_REDIRECT);

  if (!req.session.accessToken) {
    return res.status(403).end();
  }

  var token = {
    access_token: req.session.accessToken,
    refresh_token: req.session.refreshToken
  };
  var of = req.session.user.mobile_number;
  mongoose.connection.collection('contacts').deleteMany({
    of: of
  }).then(function (result) {
    console.log("contacts deleted: " + result);
  })["catch"](function (error) {
    if (error) console.log("contact deletion error: " + error);
  });
  oAuth2Client.setCredentials(token);
  res.redirect("/");
  listContacts(of, oAuth2Client);
});
router.get('/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email', 'https://www.googleapis.com/auth/contacts'],
  accessType: 'offline',
  prompt: 'consent'
}));
router.get('/auth/google/callback', passport.authenticate('google', {
  failureRedirect: '/login'
}), function (req, res) {
  // Successful authentication, redirect home.
  // create new session to prevent session fixation attacks
  var prevSession = req.session;
  req.session.regenerate(function (err) {
    Object.assign(req.session, prevSession); // res.redirect('/success');
  });
  res.redirect('/success');
});
router.get("/getusers", function _callee3(req, res) {
  var db, users;
  return regeneratorRuntime.async(function _callee3$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          db = mongoose.connection;
          _context4.next = 3;
          return regeneratorRuntime.awrap(db.collection("user-contacts").find({
            of: req.session.user.mobile_number
          }).toArray());

        case 3:
          users = _context4.sent;
          res.send(users);

        case 5:
        case "end":
          return _context4.stop();
      }
    }
  });
});
router.get("/logout", function (req, res) {
  req.session = null;
  req.logout();
  res.redirect("/");
});
module.exports = router;