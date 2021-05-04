const path = require("path");
const express = require("express");
const translate = require("translate");
var DetectLanguage = require('detectlanguage');
// const {
//     sendWelcomeEmail,
//     sendCancellationEmail,
//     sendDetails
// } = require("../emails/account");

const router = new express.Router();

router.get("/", (req, res) => {
    if (req.session.authenticated) {
        res.redirect("/chat");
    } else {
        console.log("this shouldn't be executing");
        res.redirect("/login");
    }
});

router.get("/chat", (req, res) => {
    if (!req.session.authenticated) {
        res.redirect("/login");
    }

    res.sendFile("chat.html", { root: "./public" });
});

router.get("/login", (req, res) => {
    if (req.session.authenticated) {
        res.redirect("/chat");
    }
    res.sendFile("login.html", { root: "./public" });
});

router.get("/translate/:text", async (req, res) => {
    const text = req.params.text;
    const key = process.env.LANGUAGE_DETECTION_KEY
    var detectLanguage = new DetectLanguage({
        key,
        ssl: false
    });
    
    console.log(text);
    var result;
    
    translate.engine = "yandex";
    translate.key = process.env.TRANSLATOR_KEY;

    detectLanguage.detect(text, async (error, result) => {
        const from = result[0].language;
        const translated = await translate(text, { from });
        res.send(translated);
    });
});

router.get("*", (req, res) => {
    res.redirect("/");
});

module.exports = router;
