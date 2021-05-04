"use strict";

var mongoose = require("mongoose");

var MessageSchema = new mongoose.Schema({
  from: {
    type: String
  },
  to: {
    type: String
  },
  text: {
    type: String
  }
}, {
  timestamps: true
});

MessageSchema.methods.toJSON = function () {
  var msg = this;
  var msgObject = msg.toObject();
  delete msgObject._id;
  delete msgObject.updatedAt;
  return msgObject;
};

var Message = mongoose.model("messages", MessageSchema);
module.exports = Message;