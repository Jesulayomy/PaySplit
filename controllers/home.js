const { Type } = require("@google/genai");
const { User, Contribution, Payment, Item } = require('../models/models');
const AI = require('../middleware/ai');

module.exports = {
  getIndex: async (req, res) => {
    res.render("index.ejs", { user: req.user || null, title: 'Home' });
  },
  getHomePage: async (req, res) => {
    Contribution.find({
      $or: [
      { 'invites.user._id': req.user._id },
      { 'contributors.payment.user._id': req.user._id },
      { 'owner._id': req.user._id }
      ]
    }).then(contributions => {
      res.render('home.ejs', { contributions, user: req.user, title: 'My Contributions' });
    }).catch(err => {
      console.error(err);
      res.status(500).send('Error fetching contributions' + err);
    });
  },
  notFound: async (req, res) => {
    res.render(
      "not-found",
      {user: null, title: 'Not found', message: 'Why would you lead us here???', returnTo: { page: 'Home', URL: '/home'}
    });
  },
  getUsers: async (req, res) => {
    User.find()
    .then(users => {
      res.status(200).json({ users });
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Error fetching users' + err);
    });
  },
  getProfile: async (req, res) => {
    Payment.find({
      'user._id': req.user._id
    }).then(payments => {
      const paymentIds = {};
      payments.forEach(payment => { paymentIds[payment._id] = true});
      Contribution.find({
        'contributors.payment._id': { $in: Object.keys(paymentIds) }
      }).then(contributions => {
        const contributionPayments = {};
        contributions.forEach(contribution => {
          contribution.contributors.forEach(contributor => {
            if (paymentIds[contributor.payment._id]) {
              contributionPayments[contribution.name] = contributor.payment.amount;
            }
          });
        });
        res.render('profile.ejs', { payments: contributionPayments, user: req.user, title: req.user.firstName + ' | Your profile' });
      })
    });
  },
  getReceipt: async (req, res) => {
    if (!req.file) {
      res.status(400).json({'error': 'Please attach an image'});
    } else {
      const base64ImageFile = req.file.buffer.toString('base64');
      const contents = [
        {
          inlineData: {
            mimeType: req.file.mimetype,
            data: base64ImageFile,
          },
        },
        { text: `
          The image below contains a receipt, extract the data and return a JSON response, 
          do not include any content in your response that is not the json text, all numbers must be to 2 decimal places
          `
        },
      ];

      const response = await AI.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: contents,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tip: {
                type: Type.NUMBER,
                description: 'Tip in usd to two decimal places, or 0 if not found',
                nullable: false,
                default: 0,
              },
              tax: {
                type: Type.NUMBER,
                description: 'Tax in usd to two decimal places, or 0 if not found',
                nullable: false,
                default: 0,
              },
              total: {
                type: Type.NUMBER,
                description: 'The total in usd to two decimal places',
                nullable: false,
              },
              amount: {
                type: Type.NUMBER,
                description: 'The subtotal in usd, or the cost of all items in the receipt to two decimal places',
                nullable: false,
              },
              name: {
                type: Type.STRING,
                description: 'The name of the receipt, store, or RECEIPT',
                nullable: false,
              },
              description: {
                type: Type.STRING,
                description: 'A short general description or summary of the items bought',
                nullable: false,
              },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    'quantity': {
                      type: Type.NUMBER,
                      description: 'The number of the items bought to two decimal places',
                      nullable: false,
                      default: 0,
                    },
                    'price': {
                      type: Type.NUMBER,
                      description: 'The price of the item in usd to two decimal places',
                      nullable: false,
                    },
                    'name': {
                      type: Type.STRING,
                      description: 'The name or description of the item',
                      nullable: false,
                    },
                  },
                  required: ['quantity', 'price', 'name'],
                }
              }
            },
            required: ['tip', 'tax', 'total', 'amount', 'name', 'description', 'items'],
          },
        },
      });
      res.status(200).json({response});
    }
  },
};
