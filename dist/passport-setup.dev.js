"use strict";

var passport = require('passport');

var GoogleStrategy = require('passport-google-oauth20').Strategy;

require('dotenv').config();

passport.serializeUser(function (user, done) {
  // done(null, user.id);
  done(null, user);
}); // passport.deserializeUser(function (id, done) {

passport.deserializeUser(function (user, done) {
  // User.findById(id, function (err, user) {
  done(null, user); // });
});
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_PEOPLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_PEOPLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_PEOPLE_REDIRECT,
  passReqToCallback: true
}, function (req, accessToken, refreshToken, otherTokenDetails, profile, done) {
  // User.findOrCreate({ googleId: profile.id }, function (err, user) {
  req.session.accessToken = accessToken;
  req.session.refreshToken = refreshToken;
  req.session.scope = otherTokenDetails.scope;
  req.session.token_type = otherTokenDetails.token_type;
  req.session.expiry_date = new Date().getTime() + otherTokenDetails.expires_in;
  return done(null, profile); // });
}));