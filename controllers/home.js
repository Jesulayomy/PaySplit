const { Type } = require("@google/genai");
const { User, Contribution, Payment, Item } = require('../models/models');
const AI = require('../middleware/ai');
const cloudinary = require("../middleware/cloudinary");

module.exports = {
  getIndex: async (req, res) => {
    res.render("index.ejs", { user: req.user || null, title: 'Home' });
  },
  getHomePage: async (req, res) => {
    Contribution.find({
      $or: [
      { 'invites': req.user._id },
      { 'contributors.user': req.user._id },
      { 'owner': req.user._id }
      ]
    })
    .populate('owner')
    .populate({
      path: 'invites',
      // populate: {
      //   path: 'user'
      // }
    })
    .populate({
      path: 'contributors',
      populate: {
        path: 'user'
      }
    })
    .then(contributions => {
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
    Contribution.find({
      $or: [
      { 'invites': req.user._id },
      { 'contributors.user': req.user._id },
      { 'owner': req.user._id }
      ]
    })
    .populate('owner')
    .populate({
      path: 'invites',
    })
    .populate({
      path: 'contributors',
      populate: {
        path: 'user'
      }
    })
    .then(contributions => {
      const payments = {};
      contributions.forEach(contribution => {
        const userContribution = contribution.contributors.filter(contributor => contributor.user._id.toString() === req.user.id);
        payments[contribution.name] = userContribution ? userContribution[0].amount : 0;
      })
      res.render('profile.ejs', { payments, user: req.user, title: req.user.firstName + ' | Your profile', total: Object.values(payments).reduce((acc, amount) => acc + amount, 0) });
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Error fetching contributions' + err);
    });
  },
  editProfile: async (req, res) => {
    const validationErrors = [];
    const { firstName, lastName, password, confirmPassword } = req.body
    if (password) {
      if (!validator.isLength(password, { min: 8 }))
        validationErrors.push({
          msg: "Password must be at least 8 characters long",
        });
      if (password !== confirmPassword)
        validationErrors.push({ msg: "Passwords do not match" });
    }
    if (validationErrors.length) {
      req.flash("errors", validationErrors);
      return res.redirect("/profile");
    }
    let result = null;
    if (req.file) {
      if (req.user.cloudinaryId) cloudinary.uploader.destroy(req.user.cloudinaryId);
      result = await cloudinary.uploader.upload(req.file.path, { asset_folder: 'paysplit', public_id_prefix: 'user'  });
    }
    let updates = {}
    if (firstName) updates['firstName'] = firstName;
    if (lastName) updates['lastName'] = lastName;
    if (password) updates['password'] = User.generateHash(password);
    if (result) {
      updates['imgURL'] = result.secure_url;
      updates['cloudinaryId'] = result.public_id;
    }

    User.findOneAndUpdate(
      { _id: req.user.id },
      {$set: updates}
    ).then(user => {
      res.redirect('/profile');
    })
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
