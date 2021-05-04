"use strict";

require("./db/mongoose");

require("./passport-setup");

require("dotenv").config();

var path = require("path");

var http = require("http");

var express = require("express");

var session = require("express-session");

var mongoose = require("mongoose");

var MongoStore = require("connect-mongo")(session);

var Filter = require("bad-words");

var cors = require("cors");

var socketio = require("socket.io");

var passport = require('passport');

var userRouter = require("./routers/user");

var apiRouter = require("./routers/api");

var googlePeopleRouter = require("./routers/google-people");

var _require = require("./utils/messages"),
    generateMessage = _require.generateMessage,
    generateLocationMessage = _require.generateLocationMessage;

var _require2 = require("./utils/users"),
    addUser = _require2.addUser,
    removeUser = _require2.removeUser,
    getUser = _require2.getUser,
    getUsersInRoom = _require2.getUsersInRoom;

var validator = require("validator");

var User = require("./models/user");

var Message = require("./models/message");

var app = express();
var server = http.createServer(app);
var io = socketio(server, {
  cors: {
    origin: "http://localhost:3001"
  }
});
var db = mongoose.connection;
var publicDirectoryPath = path.join(__dirname, "./build"); ////////// INITIAL CONFIGS //////////

app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));
app.use(session({
  secret: process.env.SECRET,
  resave: true,
  saveUninitialized: true,
  store: new MongoStore({
    mongooseConnection: db
  })
}));
app.use(cors({
  origin: "http://localhost:3001",
  credentials: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.io = io; // for maintenance use
// app.use((req, res, next) => {
// 	res.status(503).send("Service temporarily unavailable")
// });

app.use(googlePeopleRouter); // app.use(userRouter);
// app.use(apiRouter);

app.post("/api/register", function _callee(req, res) {
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
          res.setHeader('Access-Control-Allow-Credentials', 'true');
          _context.prev = 8;
          _context.next = 11;
          return regeneratorRuntime.awrap(User.findOne({
            mobile_number: req.body.mobile_number
          }));

        case 11:
          user = _context.sent;

          if (!user) {
            _context.next = 14;
            break;
          }

          return _context.abrupt("return", res.status(409).json({
            error: "User already exists"
          }));

        case 14:
          user = new User(req.body);
          _context.next = 17;
          return regeneratorRuntime.awrap(user.save());

        case 17:
          req.session.authenticated = true;
          req.session.user = user;
          return _context.abrupt("return", res.status(200).send(user.toJSON()));

        case 22:
          _context.prev = 22;
          _context.t0 = _context["catch"](8);
          console.log(_context.t0);
          return _context.abrupt("return", res.status(500).json({
            error: "Something went wrong. please try again later."
          }));

        case 26:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[8, 22]]);
});
app.post("/api/login", function _callee2(req, res) {
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
          req.session.save(function (err) {
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
app.get("/api/me", function (req, res) {
  // if(req.session.user) {
  //     res.status(200).json(req.session.user);
  // } else {
  //     res.status(403)
  // }
  console.log(req.session);
  res.send(req.session);
});
app.use(express["static"](publicDirectoryPath));
app.get("/*", function (req, res) {
  res.sendFile(__dirname + "/build/index.html");
});
io.on("connection", function (socket) {
  console.log("New connection");
  console.log(socket.id);
  var mobile_number = socket.handshake.auth.mobile_number;
  console.log("Joining room " + mobile_number);
  socket.join(mobile_number);
  socket.on("join", function (data, callback) {
    // const { error, user } = addUser({ id: socket.id, ...options });
    // if (error) {
    //     return callback(error);
    // }
    console.log(data.username + " Joined " + data.room);
    socket.join(data.room);
    socket.emit("message", generateMessage("Chatify", "welcome!")); // socket.broadcast
    //     .to(data.room)
    //     .emit(
    //         "message",
    //         generateMessage("Chatify", `${user.username} has joined`)
    //     );
    // io.to(data.room).emit("room-update", {
    //     room: data.room,
    //     users: getUsersInRoom(data.room),
    // });

    callback();
  });
  socket.on("message", function (message) {
    console.log("Incoming: " + message.from + " to " + message.to + " " + message.message);
    socket.to(message.to).emit("message", generateMessage(message.from, message.to, message.message)); // const msg = new Message({from: message.from, to:message.to, text: message.message});
    // msg.save();
    // socket.to(message.from).emit("message", generateMessage(message.from, message.message));
    // io.in(message.to).to(message.from).emit("message", generateMessage(message.from, message.to, message.message))
  });
  socket.on("sendMessage", function (message, callback) {
    var user = getUser(socket.id);
    var filter = new Filter();

    if (filter.isProfane(message)) {
      return callback("profanity is not allowed");
    }

    io.to(user.room).emit("message", generateMessage(user.username, message));
    callback();
  });
  socket.on("send-location", function (coords, callback) {
    var user = getUser(socket.id);
    io.to(user.room).emit("locationMessage", generateLocationMessage(user.username, "https://google.com/maps?q=".concat(coords.latitude, ",").concat(coords.longitude)));
    callback();
  });
  socket.on("send-location-error", function (callback) {
    var user = getUser(socket.id);
    io.to(user.room).emit("locationMessageError", "Something went wrong sharing location.");
    callback();
  });
  socket.on("disconnect", function () {
    var user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit("message", generateMessage("Chatify", "".concat(user.username, " has left")));
      io.to(user.room).emit("room-update", {
        room: user.room,
        users: getUsersInRoom(user.room)
      });
    }
  });
});
module.exports = server;