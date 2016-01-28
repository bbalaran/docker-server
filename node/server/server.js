var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var GithubStrategy = require('passport-github');
var app = express();
var api = require('./api/api');
var apikeys = require('./config/apikeys.js');

//var config = require('./config/config');
// db.url is different depending on NODE_ENV
// require('mongoose').connect(config.db.url);
var redis = require('redis');
var client = redis.createClient('6379','redis'); // By default will use 127.0.0.1 and 6379 as the hostname and port respectively



// setup the app middlware
require('./middleware/appMiddleware')(app);

// setup the api
app.use('/api/', api);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static(__dirname + '/../client'));
app.use(cookieParser());
app.use(session({
  secret: 'shhhhh this is a secret',
  resave: true,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// set up global error handling

//OAuth
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

// When user logged in does a get req to auth/google/callback
passport.use(new GithubStrategy({
    clientID: apikeys.githubOauth.clientID,
    clientSecret: apikeys.githubOauth.clientSecret,
    // callbackURL: "https://fathomless-sands-7752.herokuapp.com/auth/google/callback"
    callbackURL: "http://127.0.0.1:8000/auth/github/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    controllers.isUserInDb(profile.emails[0].value, function(inDb) {
      // if the username/email is in the database run login
      if (inDb) {
        googleAuth.login({
          profile: profile
        }, function(err, profile) {
          return done(err, profile);
        });
      } else {
        googleAuth.signup({
          profile: profile
        }, function(err, profile) {
          return done(err, profile);
        })
      }
    })
  }));

// export the app for testing
module.exports = app;