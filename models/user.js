const mongoose = require("mongoose");
const validator = require("validator");
// const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		trim: true,
	},
	mobile_number: {
		type: String,
		unique: true,
		required: true,
		trim: true,
		validate(value) {
			if (!validator.isMobilePhone(value, "en-IN", {strictMode: true})) {
				throw new Error("Invalid Mobile Number");
			}
		},
	},
	password: {
		type: String,
		required: true,
		minlength: 7,
		trim: true,
	},
	avatar: {
		type: Buffer
	}
}, {
	timestamps: true
});

userSchema.methods.toJSON = function () {
	const user = this;
	const userObject = user.toObject();

	delete userObject.password;
	delete userObject.avatar;

	return userObject;
};

userSchema.statics.findByCredentials = async (mobile_number, password) => {
	const user = await User.findOne({ mobile_number });

	if (!user) {
		return undefined;
	}

	// const isMatch = await bcrypt.compare(password, user.password);
	const isMatch = password == user.password;

	if (!isMatch) {
		return undefined;
	}

	return user;
};

// TODO: uncomment for production env. commented for debugging purposes.
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

const User = mongoose.model("User", userSchema);

module.exports = User;
