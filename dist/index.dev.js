"use strict";

var server = require("./app");

var port = process.env.PORT || 3000;
server.listen(port, function () {
  console.log("Server is up and running on port " + port);
});