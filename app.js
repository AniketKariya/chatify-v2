require("./db/mongoose");
require("./passport-setup");
require("dotenv").config();
const path = require("path");
const http = require("http");
const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const MongoStore = require("connect-mongo")(session)
const Filter = require("bad-words");
const cors = require("cors");
const socketio = require("socket.io");
const passport = require('passport');
const userRouter = require("./routers/user");
const apiRouter = require("./routers/api");
const googlePeopleRouter = require("./routers/google-people");
const {
    generateMessage,
    generateLocationMessage,
} = require("./utils/messages");
const {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom,
} = require("./utils/users");

const validator = require("validator");
const User = require("./models/user");
const Message = require("./models/message");

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
    cors: {
        origin: "http://localhost:3001"
    }
});

const db = mongoose.connection;
const publicDirectoryPath = path.join(__dirname, "./build");

////////// INITIAL CONFIGS //////////
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SECRET,
    resave: true,
    saveUninitialized: true,
    store: new MongoStore({mongooseConnection: db})
}))
app.use(cors({
    origin: "http://localhost:3001",
    credentials: true
}))
app.use(passport.initialize());
app.use(passport.session());

app.io = io;

// for maintenance use
// app.use((req, res, next) => {
// 	res.status(503).send("Service temporarily unavailable")
// });

app.use(googlePeopleRouter);
// app.use(userRouter);
// app.use(apiRouter);


app.post("/api/register", async (req, res) => {
    console.log(req.body);

    if (!req.body.name || !req.body.mobile_number || !req.body.password) {
        return res.status(400).json({error: "All fields are required"});
    }

    if (req.body.password.length <= 7) {
        return res.status(400).json({error: "Password must contain atleast 8 characters"});
    }

    if (!validator.isMobilePhone(req.body.mobile_number, "en-IN", {strictMode: true})) {
        return res.status(400).json({error: "Invalid mobile number"});
    }
    
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    try {
        let user = await User.findOne({mobile_number: req.body.mobile_number});

        if (user) {
            return res.status(409).json({error: "User already exists"})
        }

        user = new User(req.body);    
        await user.save();

        req.session.authenticated = true;
        req.session.user = user;

        return res.status(200).send(user.toJSON());
    } catch (error) {
        console.log(error);
        return res.status(500).json({error: "Something went wrong. please try again later."});
    }
})

app.post("/api/login", async (req, res) => {
    
    console.log(req.body);
    
    if (!req.body.mobile_number || !req.body.password) {
        return res.status(400).json({error: "All fields are required."});
    }
    
    if (!validator.isMobilePhone(req.body.mobile_number, "en-IN", {strictMode: true})) {
        return res.status(400).json({error: "Invalid mobile number"});
    }

    // try {
        const user = await User.findByCredentials(
            req.body.mobile_number,
            req.body.password
        );

        if(!user) {
            return res.status(400).json({error: "wrong mobile number or password"});
        }

        res.setHeader('Access-Control-Allow-Credentials', 'true')
        req.session.authenticated = true;
        req.session.user = user;
        req.session.save((err) => {
            if(err) console.log("cannot save session: " + err);
        })

        res.status(200).send(user.toJSON());
        // res.redirect("/");
    // } catch (error) {
    //     return res.status(500).json({error: "Something went wrong. please try again later."});
    // }
});

app.get("/api/me", (req,  res) => {
    // if(req.session.user) {
    //     res.status(200).json(req.session.user);
    // } else {
    //     res.status(403)
    // }
    console.log(req.session);
    res.send(req.session);
})

app.use(express.static(publicDirectoryPath));

app.get("/*", (req, res) => {
    res.sendFile(__dirname + "/build/index.html");
})

io.on("connection", (socket) => {
    console.log("New connection");
    console.log(socket.id);

    const mobile_number = socket.handshake.auth.mobile_number;
    console.log("Joining room " + mobile_number);
    socket.join(mobile_number)

    socket.on("join", (data, callback) => {
        // const { error, user } = addUser({ id: socket.id, ...options });

        // if (error) {
        //     return callback(error);
        // }
        console.log(data.username + " Joined " + data.room);
        socket.join(data.room);
        socket.emit("message", generateMessage("Chatify", "welcome!"));
        // socket.broadcast
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

    socket.on("message", (message) => {
        console.log("Incoming: " + message.from + " to " + message.to + " " + message.message);
        socket.to(message.to).emit("message", generateMessage(message.from, message.to, message.message));
        // const msg = new Message({from: message.from, to:message.to, text: message.message});
        // msg.save();
        // socket.to(message.from).emit("message", generateMessage(message.from, message.message));
        // io.in(message.to).to(message.from).emit("message", generateMessage(message.from, message.to, message.message))
    })

    socket.on("sendMessage", (message, callback) => {
        const user = getUser(socket.id);
        const filter = new Filter();

        if (filter.isProfane(message)) {
            return callback("profanity is not allowed");
        }

        io.to(user.room).emit(
            "message",
            generateMessage(user.username, message)
        );
        callback();
    });

    socket.on("send-location", (coords, callback) => {
        const user = getUser(socket.id);
        io.to(user.room).emit(
            "locationMessage",
            generateLocationMessage(
                user.username,
                `https://google.com/maps?q=${coords.latitude},${coords.longitude}`
            )
        );
        callback();
    });

    socket.on("send-location-error", (callback) => {
        const user = getUser(socket.id);
        io.to(user.room).emit(
            "locationMessageError",
            "Something went wrong sharing location."
        );
        callback();
    });

    socket.on("disconnect", () => {
        const user = removeUser(socket.id);

        if (user) {
            io.to(user.room).emit(
                "message",
                generateMessage("Chatify", `${user.username} has left`)
            );
            io.to(user.room).emit("room-update", {
                room: user.room,
                users: getUsersInRoom(user.room),
            });
        }
    });
});

module.exports = server;
