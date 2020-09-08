/*  EXPRESS SETUP  */

const express = require('express');
const app = express();

app.use(express.static(__dirname));

const bodyParser = require('body-parser');
const expressSession = require('express-session')({
  secret: 'secret',
  resave: false,
  saveUninitialized: false
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressSession);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('App listening on port ' + port));

const passport = require('passport');

app.use(passport.initialize());
app.use(passport.session());

/* MONGOOSE SETUP */

const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

mongoose.connect('mongodb://localhost/JonesonDB',
  { useNewUrlParser: true, useUnifiedTopology: true });

const Schema = mongoose.Schema;
const UserDetail = new Schema({
  username: String,
  password: String,
  numtries: Number,
  fatoken: String,
  locked: Boolean,
});

UserDetail.plugin(passportLocalMongoose);
const UserDetails = mongoose.model('userInfo', UserDetail, 'userInfo');

passport.use(UserDetails.createStrategy());

passport.serializeUser(UserDetails.serializeUser());
passport.deserializeUser(UserDetails.deserializeUser());

//Passport API to ensure user is logged in before route is accessible
const connectEnsureLogin = require('connect-ensure-login');

//User creation
const createUsers = process.argv[3];
if (createUsers == 'createusers') {
  console.log('Creating users in db');
  UserDetails.register({ username: 'Paul', active: false }, 'paul');
  UserDetails.register({ username: 'Jay', active: false }, 'jay');
  UserDetails.register({ username: 'Roy', active: false }, 'roy');
  UserDetails.register({ username: 'Test', active: false }, 'test');
  UserDetails.register({ username: 'Test2', active: false }, 'test2');
  UserDetails.register({ username: 'Test3', active: false }, 'test3');
}

//Email set up
global.otpEmail = process.argv[2]; //Retrieving email from the command line
console.log('Your OTP email: ', process.argv[2]);
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'jshb.test@gmail.com',
    pass: 'helloworld123!'
  }
});
const mailOptions = {
  from: 'jshb.test@gmail.com',
  to: otpEmail,
  subject: 'OTP from Simplified Health Beats Test - Joneson',
  text: '',
};

//Encryption modules
const crypto = require('crypto');
global.cryptoKey = 'cryptokey';

//Encryption
function encrypt(text) {
  var cipher = crypto.createCipher('aes-256-cbc', cryptoKey);
  var crypted = cipher.update(text, 'utf8', 'hex');
  crypted += cipher.final('hex');
  return crypted;
}
//Decryption
function decrypt(text) {
  if (text === null || typeof text === 'undefined') { return text; };
  var decipher = crypto.createDecipher('aes-256-cbc', cryptoKey);
  var dec = decipher.update(text, 'hex', 'utf8');
  dec += decipher.final('utf8');
  return dec;
}

//POST and GET routing logic
app.post('/login', (req, res, next) => {
  passport.authenticate('local',
    (err, user, info) => {
      if (err) return next(err);
      if (!user) //stay at login page with error msg displayed
        return res.redirect('/login?info=' + info);
      req.logIn(user, function (err) {
        if (err) return next(err);
        else {
          if (user.locked) //Do not allow locked users to continue
            return res.sendFile('html/locked.html', { root: __dirname });
          //Generate an fa token between 1 - 1000 upon successful login
          var token = Math.floor(Math.random() * 1000).toString();
          //Send token via email
          mailOptions.text = token;
          transporter.sendMail(mailOptions, function (error, info) {
            if (error) console.log(error);
          });
          //Encrypt token
          var encToken = encrypt(token);
          //Store token into DB and redirect user to verification page
          UserDetails.findOneAndUpdate({ 'username': req.body.username },
            { fatoken: encToken },
            function (err, flag) {
              if (err) return handleError(err);
              return res.redirect('/verify');
            }
          );
        }
      });
    })(req, res, next);
});

app.post('/verify', function (req, res) {
  //Retrieve user details from DB
  UserDetails.findOne(
    { 'username': req.body.username },
    function (err, user) {
      if (err)
        return handleError(err);
      var faToken = decrypt(user.fatoken);
      //If the user is entering wrong 2FA for the 3rd time, lock it
      if (user.numtries == 2 && req.body.authcode != faToken) {
        UserDetails.findOneAndUpdate(
          { 'username': req.body.username },
          { numtries: 3, locked: true, },
          function (err, flag) { if (err) return handleError(err); }
        );
        return res.sendFile('html/locked.html', { root: __dirname });
      }
      else {
        //If no valid FA token found, e.g user clicked back after entering token successfully
        //return user to login
        if (faToken == null)
          return res.redirect('/login');
        if (req.body.authcode != faToken) { //User entered wrong 2FA token
          //Increase the failed tries by 1
          UserDetails.findOneAndUpdate(
            { 'username': req.body.username },
            { $inc: { numtries: 1 } },
            function (err, done) { if (err) return handleError(err); }
          );
          //Redirect user back to the page for 2FA auth, with error message displayed
          return res.redirect('/verify?info=wrongotp');
          //return res.sendFile('html/2fa.html', { root: __dirname });
        }
        //Successful login, reset account - failed tries set back to 0, 2FA set to null
        else {
          UserDetails.findOneAndUpdate(
            { 'username': req.body.username },
            { numtries: 0, fatoken: null, },
            function (err, done) {
              if (err) return handleError(err);
              return res.sendFile('html/success.html', { root: __dirname });
            }
          );
        }
      }
    }
  );
});

//Direct to login page during start of app
app.get('/',
  (req, res) => res.sendFile('html/index.html', { root: __dirname })
);

app.get('/login',
  (req, res) => res.sendFile('html/index.html', { root: __dirname })
);

app.get('/verify',
  connectEnsureLogin.ensureLoggedIn(),
  (req, res) => res.sendFile('html/2fa.html', { root: __dirname })
);

//Allows retrieval of user info for HTML formatting
app.get('/user',
  connectEnsureLogin.ensureLoggedIn(), (req, res) => res.send({ user: req.user })
);