const { User, Contribution, Payment } = require('./models/models');

module.exports = function(app, passport, io) {
  app.get('/', function(req, res) {
    res.render('index.ejs', { user: req.user || null, title: 'Home' });
  });

  app.get('/home', isLoggedIn, (req, res) => {
    Contribution.find({
      $or: [
      { 'invites.user._id': req.user._id },
      { 'contributors.payment.user._id': req.user._id },
      { 'owner._id': req.user._id }
      ]
    }).then(contributions => {
      res.render('home.ejs', { contributions, user: req.user, title: 'My Contributions' });
    }).catch(err => {
      console.log(err);
      res.status(500).send('Error fetching contributions');
    });
  });

  app.get('/users', isLoggedIn, (req, res) => {
    User.find({ _id: { $ne: req.user._id }})
    .then(users => {
      res.status(200).json({ users });
    })
    .catch(err => {
      console.log(err);
      res.status(500).send('Error fetching contributions');
    });
  });

  app.get('/contributions/new', isLoggedIn, (req, res) => {
    res.render('newContribution.ejs', { user: req.user, title: 'New Contribution' });
  });

  app.post('/contributions/new', isLoggedIn, (req, res) => {
    let { name, description, amount, tax, tip, varied, taxType, tipType } = req.body;
    amount = Number(amount);
    tax = Number(tax);
    tip = Number(tip);
    let tipAmount = 0;
    let taxAmount = 0;
    tipAmount += tipType === "dollar" ? tip : amount * tip / 100;
    taxAmount += taxType === "dollar" ? tax : amount * tax / 100;

    const newPayment = new Payment({
      amount: 0,
      paid: false,
      user: req.user,
    });
    newPayment.save().then((payment) => {
      const newContribution = new Contribution({
        name,
        description,
        amount,
        tax: taxAmount,
        tip: tipAmount,
        varied,
        completed: false,
        total: amount + taxAmount + tipAmount,
        date: new Date(),
        owner: req.user,
        contributors: [{ payment }]
      });
      newContribution.save().then((contribution) => {
        res.json(contribution);
      }).catch(err => {
        console.log(err);
        res.status(500).send('Error saving contribution');
      });
    }).catch(err => {
      console.log(err);
      res.status(500).json({error: 'Internal Server Error'})
    });
  });

  app.get('/contributions/:contributionID', isLoggedIn, (req, res) => {
    const id = req.params.contributionID;
    Contribution.findOne(
      { _id: id }
    ).then(contribution => {
      if (contribution) {
        const invite = contribution.invites.some(invite => invite.user._id.toString() === req.user._id.toString());
        if (contribution.owner.equals(req.user._id)) {
          res.render('myContribution.ejs', { item: contribution, user: req.user, title: contribution.name, invite });
        } else {
          res.render('contribution.ejs', { item: contribution, user: req.user, title: contribution.name, invite });
        }
      } else {
        res.status(404).send('Contribution not found');
      }
    }).catch(err => {
      console.log(err);
      res.status(500).send('Error fetching contribution');
    });
  });

  app.put('/contributions/:contributionID', isLoggedIn, (req, res) => {
    let { name, description, amount, tax, tip, varied, taxType, tipType } = req.body;
    amount = Number(amount);
    tax = Number(tax);
    tip = Number(tip);
    let tipAmount = 0;
    let taxAmount = 0;
    tipAmount += tipType === "dollar" ? tip : amount * tip / 100;
    taxAmount += taxType === "dollar" ? tax : amount * tax / 100;

    Contribution.findOneAndUpdate(
      { _id: req.params.contributionID },
      {
        $set: {
          name,
          description,
          amount,
          tax: taxAmount,
          tip: tipAmount,
          varied,
          total: amount + taxAmount + tipAmount,
        }
      },
      { new: true }
    ).then(updatedItem => {
      if (updatedItem) {
        res.status(200).send('Contribution updated successfully');
      } else {
        res.status(404).send('Contribution not found');
      }
    }).catch(err => {
      console.log(err);
      res.status(500).send('Error updating contribution');
    });
  });

  app.delete('/contributions/:contributionID', isLoggedIn, (req, res) => {
    Contribution.findOne({
      _id: req.params.contributionID
    })
      .then((contribution) => {
        if (contribution) {
          const paymentIds = contribution.contributors.map(
            (contributor) => contributor.payment._id
          );
          Payment.deleteMany({
            _id: { $in: paymentIds }
          })
            .then(() => {
              Contribution.findOneAndDelete({
                _id: req.params.contributionID
              })
                .then((deletedItem) => {
                  if (deletedItem) {
                    res
                      .status(200)
                      .json({
                        success:
                          'Contribution and associated payments deleted successfully'
                      });
                  } else {
                    res.status(404).json({ error: 'Contribution not found' });
                  }
                })
                .catch((err) => {
                  res.status(500).send(`Error deleting contribution: ${err}`);
                });
            })
            .catch((err) => {
              res.status(500).send(`Error deleting payments: ${err}`);
            });
        } else {
          res.status(404).json({ error: 'Contribution not found' });
        }
      })
      .catch((err) => {
        res.status(500).send(`Error fetching contribution: ${err}`);
      });
  });

  app.post('/contributions/:contributionID/pay', isLoggedIn, (req, res) => {
    const id = req.params.contributionID;
    const newPayment = new Payment({
      amount: 100,
      paid: true,
      user: req.user,
    });
    newPayment.save().then((payment) => {
      Contribution.findOneAndUpdate(
        { _id: id },
        { $push: {
          contributors: { $each: [{payment}], $position: 0 }
        }},
        { new: true}
      ).then(contribution => {
        if (contribution) {
          if (contribution.owner.equals(req.user._id)) {
            res.render('myContribution.ejs', { item: contribution, user: req.user, title: contribution.name });
          } else {
            res.render('contribution.ejs', { item: contribution, user: req.user, title: contribution.name });
          }
        } else {
          res.status(404).send('Contribution not found');
        }
      }).catch(err => {
        console.log(err);
        res.status(500).send(err);
      });
    }).catch(err => {
      console.log(err);
      res.status(500).json({error: 'Internal Server Error'})
    });
  });

  app.post('/contributions/:contributionID/invite', isLoggedIn, (req, res) => {
    const id = req.params.contributionID;
    const { email } = req.body;

    User.findOne({ email }).then(user => {
      if (!user) {
        return res.status(404).json({ error: `User with email '${email}' not found` });
      }

      const newPayment = new Payment({
        amount: 0,
        paid: false,
        user: user,
      });

      newPayment.save().then(payment => {
      Contribution.findOneAndUpdate(
        { _id: id },
        {
        $push: {
          invites: { user },
          contributors: { payment }
        }
        },
        { new: true }
      ).then(updatedContribution => {
        if (updatedContribution) {
          res.status(200).json({ success: 'User invited and payment added', item: updatedContribution });
        } else {
          res.status(404).json({ error: 'Contribution not found' });
        }
      }).catch(err => {
      console.log(err);
        res.status(500).json({ error: `Error updating contribution: ${err}` });
      });
      }).catch(err => {
      console.log(err);
      res.status(500).json({ error: `Error creating payment: ${err}` });
      });
    }).catch(err => {
      console.log(err);
      res.status(500).json({ error: `Error finding user: ${err}` });
    });
  });

  app.post('/contributions/:contributionID/accept', isLoggedIn, (req, res) => {
    Contribution.findOneAndUpdate({
      _id: req.params.contributionID,
    },
    {
      $pull: {
        invites: { 'user._id': req.user._id }
      }
    }).then(contribution => {
      res.status(200).json({ contribution })
    }).catch(err => {
      console.log(err);
      res.status(500).send('Error accepting invite');
    })
  });

  app.put('/contributions/:contributionID/complete', isLoggedIn, (req, res) => {
    const { completed } = req.body;
    Contribution.findOneAndUpdate(
      { _id: req.params.contributionID, 'owner._id': req.user._id },
      {
        $set: {
          completed
        }
      },
      { new: true }
    ).then(updatedItem => {
      if (updatedItem) {
        res.status(200).send('Contribution completed successfully');
      } else {
        res.status(404).send('Contribution not found');
      }
    }).catch(err => {
      console.log(err);
      res.status(500).send('Error updating contribution');
    });
  });

  app.get('/logout', function(req, res) {
    req.logout(() => {console.log(`User logged out`)});
    res.redirect('/');
  });

  app.get('/login', function(req, res) {
    res.render('login.ejs', { message: req.flash('loginMessage'), user: null, title: 'Login'  });
  });

  app.post('/login', passport.authenticate('login', {
    successRedirect: '/home',
    failureRedirect: '/login',
    failureFlash: true
  }));

  app.get('/signup', function(req, res) {
    res.render('signup.ejs', { message: req.flash('signupMessage'), user: null, title: 'Sign up'  });
  });

  app.post('/signup', passport.authenticate('signup', {
    successRedirect: '/home',
    failureRedirect: '/signup',
    failureFlash: true
  }));
};

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/');
}
