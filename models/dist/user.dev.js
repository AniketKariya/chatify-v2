"use strict";

var mongoose = require("mongoose");

var validator = require("validator"); // const bcrypt = require("bcrypt");


var userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  mobile_number: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    validate: function validate(value) {
      if (!validator.isMobilePhone(value, "en-IN", {
        strictMode: true
      })) {
        throw new Error("Invalid Mobile Number");
      }
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 7,
    trim: true
  },
  avatar: {
    type: Buffer
  }
}, {
  timestamps: true
});

userSchema.methods.toJSON = function () {
  var user = this;
  var userObject = user.toObject();
  delete userObject.password;
  delete userObject.avatar;
  return userObject;
};

userSchema.statics.findByCredentials = function _callee(mobile_number, password) {
  var user, isMatch;
  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.next = 2;
          return regeneratorRuntime.awrap(User.findOne({
            mobile_number: mobile_number
          }));

        case 2:
          user = _context.sent;

          if (user) {
            _context.next = 5;
            break;
          }

          return _context.abrupt("return", undefined);

        case 5:
          // const isMatch = await bcrypt.compare(password, user.password);
          isMatch = password == user.password;

          if (isMatch) {
            _context.next = 8;
            break;
          }

          return _context.abrupt("return", undefined);

        case 8:
          return _context.abrupt("return", user);

        case 9:
        case "end":
          return _context.stop();
      }
    }
  });
}; // TODO: uncomment for production env. commented for debugging purposes.
// userSchema.pre("save", async function (next) {
// 	const user = this;
// 	if (user.isModified("password")) {
// 		user.password = await bcrypt.hash(user.password, 8);
// 	}
// 	next();
// });
// userSchema.pre("remove", async function (next) {
// 	const user = this;
// 	await Task.deleteMany({owner: user._id});
// 	next()
// });


var User = mongoose.model("User", userSchema);
module.exports = User;