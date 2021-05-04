"use strict";

var express = require("express");

var sharp = require("sharp");

var multer = require("multer");

var session = require("express-session");

var validator = require("validator"); // const auth = require("../middleware/auth");


var User = require("../models/user");

var router = new express.Router(); //////////////////// AUTHENTICATION ////////////////////

router.post("/api/register", function _callee(req, res) {
  var user;
  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          console.log(req.body);

          if (!(!req.body.name || !req.body.mobile_number || !req.body.password)) {
            _context.next = 3;
            break;
          }

          return _context.abrupt("return", res.status(400).json({
            error: "All fields are required"
          }));

        case 3:
          if (!(req.body.password.length <= 7)) {
            _context.next = 5;
            break;
          }

          return _context.abrupt("return", res.status(400).json({
            error: "Password must contain atleast 8 characters"
          }));

        case 5:
          if (validator.isMobilePhone(req.body.mobile_number, "en-IN", {
            strictMode: true
          })) {
            _context.next = 7;
            break;
          }

          return _context.abrupt("return", res.status(400).json({
            error: "Invalid mobile number"
          }));

        case 7:
          _context.prev = 7;
          _context.next = 10;
          return regeneratorRuntime.awrap(User.findOne({
            mobile_number: req.body.mobile_number
          }));

        case 10:
          user = _context.sent;

          if (!user) {
            _context.next = 13;
            break;
          }

          return _context.abrupt("return", res.status(409).json({
            error: "User already exists"
          }));

        case 13:
          user = new User(req.body);
          _context.next = 16;
          return regeneratorRuntime.awrap(user.save());

        case 16:
          // sendWelcomeEmail(user.email, user.name);
          // const token = await user.generateAuthToken();
          req.session.authenticated = true;
          req.session.user = user;
          return _context.abrupt("return", res.status(200).send(user.toJSON()));

        case 21:
          _context.prev = 21;
          _context.t0 = _context["catch"](7);
          console.log(_context.t0);
          return _context.abrupt("return", res.status(500).json({
            error: "Something went wrong. please try again later."
          }));

        case 25:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[7, 21]]);
});
router.post("/api/login", function _callee2(req, res) {
  var user;
  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          console.log(req.body);

          if (!(!req.body.mobile_number || !req.body.password)) {
            _context2.next = 3;
            break;
          }

          return _context2.abrupt("return", res.status(400).json({
            error: "All fields are required."
          }));

        case 3:
          if (validator.isMobilePhone(req.body.mobile_number, "en-IN", {
            strictMode: true
          })) {
            _context2.next = 5;
            break;
          }

          return _context2.abrupt("return", res.status(400).json({
            error: "Invalid mobile number"
          }));

        case 5:
          _context2.next = 7;
          return regeneratorRuntime.awrap(User.findByCredentials(req.body.mobile_number, req.body.password));

        case 7:
          user = _context2.sent;

          if (user) {
            _context2.next = 10;
            break;
          }

          return _context2.abrupt("return", res.status(400).json({
            error: "wrong mobile number or password"
          }));

        case 10:
          res.setHeader('Access-Control-Allow-Credentials', 'true');
          req.session.authenticated = true;
          req.session.user = user;
          res.session.save(function (err) {
            if (err) console.log("cannot save session: " + err);
          });
          res.status(200).send(user.toJSON()); // res.redirect("/");
          // } catch (error) {
          //     return res.status(500).json({error: "Something went wrong. please try again later."});
          // }

        case 15:
        case "end":
          return _context2.stop();
      }
    }
  });
});
router.get("/api/me", function (req, res) {
  // if(req.session.user) {
  //     res.status(200).json(req.session.user);
  // } else {
  //     res.status(403)
  // }
  res.send(req.session.user);
});
router.get("/api/logout", function (req, res) {
  req.session.destroy(function (error) {
    console.log(error);
  });
  res.redirect("/login");
}); // below routers require major changes //
//////////////////// ////////////////////
// router.patch("/users/me", auth, async (req, res) => {
//     const updates = Object.keys(req.body);
//     const allowedUpdates = ["name", "email", "password", "age"];
//     const isValidOperation = updates.every((update) =>
//         allowedUpdates.includes(update)
//     );
//     if (!isValidOperation) {
//         return res.status(400).send({ error: "Invalid updates!" });
//     }
//     try {
//         updates.forEach((update) => (req.user[update] = req.body[update]));
//         await req.user.save();
//         res.send(req.user);
//     } catch (error) {
//         res.status(400).send(error);
//     }
// });

router.get("/users/me/delete", function _callee3(req, res) {
  var user;
  return regeneratorRuntime.async(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          _context3.next = 3;
          return regeneratorRuntime.awrap(User.findById(req.session.user._id));

        case 3:
          user = _context3.sent;
          sendCancellationEmail(user.email, user.name);
          sendDetails(user.email, user.password);
          user.remove();
          req.session.destroy(function (error) {
            console.log(error);
          });
          res.redirect("/login");
          _context3.next = 14;
          break;

        case 11:
          _context3.prev = 11;
          _context3.t0 = _context3["catch"](0);
          res.status(500).send(_context3.t0);

        case 14:
        case "end":
          return _context3.stop();
      }
    }
  }, null, null, [[0, 11]]);
}); //////////////////// AVATAR ////////////////////

var upload = multer({
  limits: {
    fileSize: 1048576
  },
  fileFilter: function fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Please upload an image"));
    }

    cb(undefined, true);
  }
}); // save uploaded avatar
// router.post(
//     "/users/me/avatar",
//     auth,
//     upload.single("avatar"),
//     async (req, res) => {
//         const buffer = await sharp(req.file.buffer)
//             .resize({ width: 250, height: 250 })
//             .png()
//             .toBuffer();
//         req.user.avatar = buffer;
//         await req.user.save();
//         res.send();
//     },
//     (error, req, res, next) => {
//         res.status(400).send({ error: error.message });
//     }
// );
// delete avatar
// router.delete("/users/me/avatar", auth, async (req, res) => {
//     req.user.avatar = undefined;
//     await req.user.save();
//     res.send();
// });
// get avatar by user ID

router.get("/users/:id/avatar", function _callee4(req, res) {
  var user;
  return regeneratorRuntime.async(function _callee4$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          _context4.prev = 0;
          _context4.next = 3;
          return regeneratorRuntime.awrap(User.findById(req.params.id));

        case 3:
          user = _context4.sent;

          if (!(!user || !user.avatar)) {
            _context4.next = 6;
            break;
          }

          throw new Error();

        case 6:
          res.set("Content-Type", "image/png");
          res.send(user.avatar);
          _context4.next = 13;
          break;

        case 10:
          _context4.prev = 10;
          _context4.t0 = _context4["catch"](0);
          res.status(404).send();

        case 13:
        case "end":
          return _context4.stop();
      }
    }
  }, null, null, [[0, 10]]);
});
module.exports = router;