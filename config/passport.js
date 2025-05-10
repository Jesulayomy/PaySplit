const LocalStrategy = require("passport-local").Strategy;
const { User } = require('../models/models');
const cloudinary = require("../middleware/cloudinary");


module.exports = function (passport) {
  passport.use(
    'login',
    new LocalStrategy({ usernameField: "email", passwordField: "password" }, (email, password, done) => {
      User.findOne({ email: email.toLowerCase() })
      .then(user => {
        if (!user) {
          return done(null, false, { msg: `Email ${email} not found.` });
        }

        if (!user.validPassword(password)) {
          return done(
            null,
            false,
            { msg: "Oops! Email or Password is incorrect." }
          );
        }

        return done(null, user);
      })
      .catch(err => {
        if (err) {
          console.error(err)
          return done(err);
        }
      });
    })
  );

  passport.use(
    'signup',
    new LocalStrategy({ usernameField: "email", passwordField: "password", passReqToCallback: true }, (req, email, password, done) => {
      User.findOne({ email })
      .then(async existingUser => {
        if (existingUser) {
          return done(null, false, { msg: `That email is already taken.` });
        }
        const result = await cloudinary.uploader.upload(req.file.path, { asset_folder: 'paysplit', public_id_prefix: 'user'  });

        const user = new User({
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          imgURL: result.secure_url,
          cloudinaryId: result.public_id,
          email,
        });
        user.password = user.generateHash(password);
        user.save()
        .then(newUser => {
          return done(null, newUser);
        })
        .catch(err => {
          if (err) {
            return next(err);
          }
        });
      })
      .catch(err => {
        if (err) {
          console.error(err);
          return next(err);
        }
      });
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    User.findById(id)
    .then(user => done(null, user))
    .catch(err => {
      console.error(err);
      done(err);
    });
  });
};
