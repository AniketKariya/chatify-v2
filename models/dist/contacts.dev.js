"use strict";

var mongoose = require("mongoose");

var contactsSchema = new mongoose.Schema({
  of: {
    type: String
  },
  name: {
    type: String
  },
  mobile_number: {
    type: String
  }
});

contactsSchema.methods.toJSON = function () {
  var contacts = this;
  var contactsObject = contacts.toObject();
  delete contactsObject.of;
  return contactsObject;
};

var Contact = mongoose.model("Contacts", contactsSchema);
module.exports = Contact;