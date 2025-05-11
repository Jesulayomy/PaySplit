const { User, Contribution, Payment, Item } = require('../models/models');
const CastError = require('mongoose').Error.CastError;

module.exports = {
  newContribPage: async (req, res) => {
    res.render('newContribution', { user: req.user, title: 'New Contribution' });
  },
  createContrib: async (req, res) => {
    let { name, description, amount, tax, tip, equal, taxType, tipType, items } = req.body;
    amount = Math.abs(Number(amount));
    tax = Math.abs(Number(tax));
    tip = Math.abs(Number(tip));
    let tipAmount = 0;
    let taxAmount = 0;
    tipAmount += tipType === "dollar" ? tip : amount * tip / 100;
    taxAmount += taxType === "dollar" ? tax : amount * tax / 100;

    const newPayment = new Payment({
      amount: 0,
      paid: false,
      user: req.user,
    });
    const newContribution = new Contribution({
      name,
      description,
      amount,
      tax: taxAmount,
      tip: tipAmount,
      equal,
      completed: false,
      total: amount + taxAmount + tipAmount,
      remainder: amount + taxAmount + tipAmount,
      date: new Date(),
      owner: req.user,
      contributors: [newPayment],
      items: items
    });
    newContribution.save()
    .then((contribution) => {
      res.json(contribution);
    }).catch(err => {
      console.error(err);
      res.status(500).send('Error saving contribution' + err);
    });
  },
  getContrib: async (req, res) => {
    const id = req.params.contributionID;
    Contribution.findOne(
      { _id: id }
    ).then(contribution => {
      if (contribution) {
        const invite = contribution.invites.some(user => user._id.toString() === req.user._id.toString());
        if (contribution.owner.equals(req.user._id)) {
          res.render('myContribution.ejs', { item: contribution, user: req.user, title: contribution.name, invite });
        } else {
          res.render('contribution.ejs', { item: contribution, user: req.user, title: contribution.name, invite });
        }
      } else {
        res.render(
          "not-found",
          {user: req.user, title: 'Contribution Not found', message: 'That contribution isn\'t here anymore', returnTo: { page: 'Home', URL: '/home'}
        });
      }
    }).catch(err => {
      if (err instanceof CastError) {
        res.render(
          "not-found",
          {user: req.user, title: 'Contribution Not found', message: 'That\'s not even a real contribution', returnTo: { page: 'Home', URL: '/home'}
        });
      } else {
        console.error(err);
        res.status(500).send('Error fetching contribution');
      }
    });
  },
  editContrib: async (req, res) => {
    let { name, description, amount, tax, tip, equal, taxType, tipType } = req.body;
    amount = Math.abs(Number(amount));
    tax = Math.abs(Number(tax));
    tip = Math.abs(Number(tip));
    let tipAmount = 0;
    let taxAmount = 0;
    tipAmount += tipType === "dollar" ? tip : amount * tip / 100;
    taxAmount += taxType === "dollar" ? tax : amount * tax / 100;

    Contribution.findOne(
      { _id: req.params.contributionID }
    ).then(contribution => {
      if (!contribution) {
        res.render(
          "not-found",
          {user: req.user, title: 'Contribution Not found', message: 'Someone messed up and it\'s not me', returnTo: { page: 'Home', URL: '/home'}
        });
      }

      const paidAmount = contribution.contributors
        .filter(payment => payment.paid)
        .reduce((sum, payment) => sum + payment.amount, 0);

      const remainder = amount + taxAmount + tipAmount - paidAmount;

      Contribution.findOneAndUpdate(
        { _id: req.params.contributionID },
        {
          $set: {
            name,
            description,
            amount,
            tax: taxAmount,
            tip: tipAmount,
            equal,
            total: amount + taxAmount + tipAmount,
            remainder,
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
        if (err instanceof CastError) {
          res.render(
            "not-found",
            {user: req.user, title: 'Contribution Not found', message: 'That\'s not even a real contribution', returnTo: { page: 'Home', URL: '/home'}
          });
        } else {
          console.error(err);
          res.status(500).send('Error fetching contribution');
        }
      });
    }).catch(err => {
      if (err instanceof CastError) {
        res.render(
          "not-found",
          {user: req.user, title: 'Contribution Not found', message: 'That\'s not even a real contribution', returnTo: { page: 'Home', URL: '/home'}
        });
      } else {
        console.error(err);
        res.status(500).send('Error fetching contribution');
      }
    });
  },
  getContribEdit: async (req, res) => {
    const id = req.params.contributionID;
    Contribution.findOne(
      { _id: id }
    ).then(contribution => {
      if (contribution) {
        const invite = null;
        if (contribution.owner.equals(req.user._id)) {
          res.render('editContribution.ejs', { item: contribution, user: req.user, title: contribution.name, invite });
        } else {
          res.render('not-found.ejs', { user: req.user, title: 'Not Found' });
        }
      } else {
        res.render(
          "not-found",
          {user: req.user, title: 'Contribution Not found', message: 'You can\'t edit it if it doesn\'t exist', returnTo: { page: 'Home', URL: '/home'}
        });
      }
    }).catch(err => {
      if (err instanceof CastError) {
        res.render(
          "not-found",
          {user: req.user, title: 'Contribution Not found', message: 'That\'s not even a real contribution', returnTo: { page: 'Home', URL: '/home'}
        });
      } else {
        console.error(err);
        res.status(500).send('Error fetching contribution');
      }
    });
  },
  deleteContrib: async (req, res) => {
    Contribution.findOne({
      _id: req.params.contributionID
    }).then(contribution => {
      if (contribution) {
        Contribution.findOneAndDelete({
          _id: req.params.contributionID
        })
        .then((deletedItem) => {
          if (deletedItem) {
            res.status(200).json({
              success:
                'Contribution deleted successfully'
            });
          } else {
            res.status(404).json({ error: 'Contribution not found' });
          }
        })
        .catch((err) => {
          res.status(500).send(`Error deleting contribution: ${err}`);
        });
      } else {
        res.status(404).json({ error: 'Contribution not found' });
      }
    })
    .catch((err) => {
      if (err instanceof CastError) {
        res.render(
          "not-found",
          {user: req.user, title: 'Contribution Not found', message: 'It\'s not here, someone beat you to it', returnTo: { page: 'Home', URL: '/home'}
        });
      } else {
        console.error(err);
        res.status(500).send('Error fetching contribution');
      }
    });
  },
  payContrib: async (req, res) => {
    const id = req.params.contributionID;
    const amount = req.body.amount;
    Contribution.findOneAndUpdate(
      { _id: id, 'contributors.user._id': req.user._id },
      {
        $set: { 'contributors.$.paid': true },
        $inc: { 'contributors.$.amount': Math.abs(amount), 'remainder': - Math.abs(amount) },
      },
      { new: true }
    ).then(contribution => {
      if (contribution) {
        if (contribution.owner.equals(req.user._id)) {
          res.render('myContribution.ejs', { item: contribution, user: req.user, title: contribution.name, invite: false });
        } else {
          res.render('contribution.ejs', { item: contribution, user: req.user, title: contribution.name, invite: false });
        }
      } else {
        res.render(
          "not-found",
          {user: req.user, title: 'Contribution Not found', message: 'Contribution not found, did someone delete it?', returnTo: { page: 'Home', URL: '/home'}
        });
      }
    }).catch(err => {
      console.error(err);
      res.status(500).send(err);
    });
  },
  inviteToContrib: async (req, res) => {
    const id = req.params.contributionID;
    const { email } = req.body;
    if (email === req.user.email) {
      res.status(409).json({error: 'Cannot invite self'});
    } else {
      User.findOne({ email }).then(user => {
        if (!user) {
          res.status(404).json(
            {user: req.user, title: 'User not found', message: 'You tried to invite a ghost?', returnTo: { page: 'Back to contribution', URL: `/contribution/${id}`}
          });
        } else {
          const newPayment = new Payment({
            amount: 0,
            paid: false,
            user: user,
          });
          Contribution.findOneAndUpdate(
            { _id: id },
            {
            $push: {
              invites: user,
              contributors: newPayment
            }
            },
            { new: true }
          ).then(updatedContribution => {
            if (updatedContribution) {
              res.redirect('back');
            } else {
              res.status(404).json({ error: 'Contribution not found' });
            }
          }).catch(err => {
            console.error(err);
            res.status(500).json({ error: `Error updating contribution: ${err}` });
          });
        }
      }).catch(err => {
        console.error(err);
        res.status(500).json({ error: `Error finding user: ${err}` });
      });
    }
  },
  acceptContribInvite: async (req, res) => {
    Contribution.findOneAndUpdate({
      _id: req.params.contributionID,
    },
    {
      $pull: {
        invites: { '_id': req.user._id }
      }
    }).then(contribution => {
      if (!contribution) {
        res.render(
          "not-found",
          {user: req.user, title: 'Contribution Not found', message: 'That contribution isn\'t here anymore', returnTo: { page: 'Home', URL: '/home'}
        });
      } else {
        res.status(200).json({ contribution })
      }
    }).catch(err => {
      console.error(err);
      res.status(500).send('Error accepting invite');
    });
  },
  completeContrib: async (req, res) => {
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
        res.render(
          "not-found",
          {user: req.user, title: 'Contribution Not found', message: 'That contribution isn\'t here anymore', returnTo: { page: 'Home', URL: '/home'}
        });
      }
    }).catch(err => {
      console.error(err);
      res.status(500).send('Error updating contribution');
    });
  },
};

