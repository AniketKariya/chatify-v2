"use strict";

var path = require("path");

var express = require("express");

var translate = require("translate");

var DetectLanguage = require('detectlanguage'); // const {
//     sendWelcomeEmail,
//     sendCancellationEmail,
//     sendDetails
// } = require("../emails/account");


var router = new express.Router();
router.get("/", function (req, res) {
  if (req.session.authenticated) {
    res.redirect("/chat");
  } else {
    console.log("this shouldn't be executing");
    res.redirect("/login");
  }
});
router.get("/chat", function (req, res) {
  if (!req.session.authenticated) {
    res.redirect("/login");
  }

  res.sendFile("chat.html", {
    root: "./public"
  });
});
router.get("/login", function (req, res) {
  if (req.session.authenticated) {
    res.redirect("/chat");
  }

  res.sendFile("login.html", {
    root: "./public"
  });
});
router.get("/translate/:text", function _callee2(req, res) {
  var text, key, detectLanguage, result;
  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          text = req.params.text;
          key = process.env.LANGUAGE_DETECTION_KEY;
          detectLanguage = new DetectLanguage({
            key: key,
            ssl: false
          });
          console.log(text);
          translate.engine = "yandex";
          translate.key = process.env.TRANSLATOR_KEY;
          detectLanguage.detect(text, function _callee(error, result) {
            var from, translated;
            return regeneratorRuntime.async(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    from = result[0].language;
                    _context.next = 3;
                    return regeneratorRuntime.awrap(translate(text, {
                      from: from
                    }));

                  case 3:
                    translated = _context.sent;
                    res.send(translated);

                  case 5:
                  case "end":
                    return _context.stop();
                }
              }
            });
          });

        case 7:
        case "end":
          return _context2.stop();
      }
    }
  });
});
router.get("*", function (req, res) {
  res.redirect("/");
});
module.exports = router;