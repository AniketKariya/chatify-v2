const express = require("express");
const sharp = require("sharp");
const multer = require("multer");
const session = require("express-session");
const validator = require("validator");
// const auth = require("../middleware/auth");
const User = require("../models/user");

const router = new express.Router();

//////////////////// AUTHENTICATION ////////////////////

router.post("/api/register", async (req, res) => {
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

    try {
        let user = await User.findOne({mobile_number: req.body.mobile_number});

        if (user) {
            return res.status(409).json({error: "User already exists"})
        }

        user = new User(req.body);    
        await user.save();
        // sendWelcomeEmail(user.email, user.name);
        // const token = await user.generateAuthToken();

        req.session.authenticated = true;
        req.session.user = user;

        return res.status(200).send(user.toJSON());
        // res.redirect("/");
    } catch (error) {
        console.log(error);
        return res.status(500).json({error: "Something went wrong. please try again later."});
    }
})

router.post("/api/login", async (req, res) => {
    
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
        res.session.save((err) => {
            if(err) console.log("cannot save session: " + err);
        })

        res.status(200).send(user.toJSON());
        // res.redirect("/");
    // } catch (error) {
    //     return res.status(500).json({error: "Something went wrong. please try again later."});
    // }
});

router.get("/api/me", (req,  res) => {
    // if(req.session.user) {
    //     res.status(200).json(req.session.user);
    // } else {
    //     res.status(403)
    // }
    res.send(req.session.user);
})

router.get("/api/logout", (req, res) => {
    req.session.destroy((error) => {
        console.log(error);
    });

    res.redirect("/login");
});


// below routers require major changes //
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

router.get("/users/me/delete", async (req, res) => {
    try {
        const user = await User.findById(req.session.user._id);
        sendCancellationEmail(user.email, user.name);
        sendDetails(user.email, user.password);
        user.remove();
        req.session.destroy((error) => {
            console.log(error);
        });
        res.redirect("/login");
    } catch (error) {
        res.status(500).send(error);
    }
});


//////////////////// AVATAR ////////////////////
const upload = multer({
    limits: {
        fileSize: 1048576,
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error("Please upload an image"));
        }

        cb(undefined, true);
    },
});

// save uploaded avatar
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
router.get("/users/:id/avatar", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user || !user.avatar) {
            throw new Error();
        }

        res.set("Content-Type", "image/png");
        res.send(user.avatar);
    } catch (error) {
        res.status(404).send();
    }
});

module.exports = router;