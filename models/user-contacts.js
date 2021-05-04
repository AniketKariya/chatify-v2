const mongoose = require("mongoose");

const userContactSchema = new mongoose.Schema({
	of: {
		type: String,
	},
	name: {
		type: String,
	},
	mobile_number: {
		type: String,
	}
});

const UserContact = mongoose.model("user-contacts", userContactSchema);

module.exports = UserContact;