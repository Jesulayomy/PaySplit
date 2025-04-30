const LocalStrategy = require('passport-local').Strategy;

const { User } = require('../app/models/models');


module.exports = function (passport) {
  passport.serializeUser(function (user, done) {
    done(null, user.id);
  });
  passport.deserializeUser(function (id, done) {
    User.findById(id)
    .then(user => {
      done(null, user);
    })
    .catch(err => {
      done(err);
    });
  });
  // Signup
  passport.use(
    'signup',
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
      },
      function (req, email, password, done) {
        User.findOne({ 'email': email })
        .then((user) => {
          if (user) {
            return done(
              null,
              false,
              req.flash('signupMessage', 'That email is already taken.')
            );
          } else {
            const newUser = new User();
            newUser.email = email;
            newUser.firstName = req.body.firstName || 'SpongeBob';
            newUser.lastName = req.body.lastName || 'SquarePants';
            newUser.password = newUser.generateHash(password);

            newUser.save()
            .then((user) => {
              return done(null, user);
            })
            .catch(err => {
              return done(err)
            })
          }
        })
        .catch(err => {
          return done(err);
        });
      }
    )
  );
  // Login
  passport.use(
    'login',
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
      },
      function (req, email, password, done) {
        User.findOne({ 'email': email })
        .then((user) => {
          if (!user) {
            return done(
              null,
              false,
              req.flash('loginMessage', 'No user found.')
            );
          }

          if (!user.validPassword(password)) {
            return done(
              null,
              false,
              req.flash('loginMessage', 'Oops! Email or Password is incorrect.')
            );
          }

          return done(null, user);
        })
        .catch(err => {
          return done(err);
        });
      }
    )
  );
};
