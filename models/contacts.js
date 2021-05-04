const mongoose = require("mongoose");

const contactsSchema = new mongoose.Schema({
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

contactsSchema.methods.toJSON = function () {
	const contacts = this;
	const contactsObject = contacts.toObject();

	delete contactsObject.of;

	return contactsObject;
};


const Contact = mongoose.model("Contacts", contactsSchema);

module.exports = Contact;