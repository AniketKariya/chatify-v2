"use strict";

var mongoose = require("mongoose");

var userContactSchema = new mongoose.Schema({
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
var UserContact = mongoose.model("user-contacts", userContactSchema);
module.exports = UserContact;