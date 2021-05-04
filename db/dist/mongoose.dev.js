"use strict";

require('dotenv').config();

var mongoose = require("mongoose");

mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  useFindAndModify: false
})["catch"](function (err) {
  console.log("Something went wrong, cannot connection to database");
  console.log(err);
});
mongoose.connection.on("error", function (err) {
  console.log(err);
});
mongoose.connection.once("open", function () {
  console.log("Database connected");
});