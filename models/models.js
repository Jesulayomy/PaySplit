const mongoose = require('mongoose');
const bcrypt   = require('bcrypt');
const { Schema } = mongoose;


const userSchema = new Schema({
  firstName: String,
  lastName: String,
  imgURL: String,
  cloudinaryId: String,
  email: String,
  password: String,
});

const paymentSchema = new Schema({
  amount: { type: Number, default: 0 },
  user: userSchema,
  paid: { type: Boolean, default: false },
});

const itemSchema = new Schema({
  price: Number,
  quantity: { type: Number, default: 1 },
  name: String,
  paid: { type: Boolean, default: false },
});

const contributionSchema = new Schema({
  name: String,
  description: String,
  amount: Number,
  tax: Number,
  tip: Number,
  total: Number,
  remainder: Number,
  equal: Boolean,
  date: Date,
  completed: { type: Boolean, default: false },
  owner: userSchema,
  items: [itemSchema],
  invites: [{user: userSchema}],
  contributors: [{payment: paymentSchema}],
});

userSchema.methods.generateHash = function(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

userSchema.methods.validPassword = function(password) {
  return bcrypt.compareSync(password, this.password);
};

userSchema.methods.fullName = function() {
  return this.firstName + ' ' + this.lastName;
};

contributionSchema.methods.equalSplit = function() {
  const unpaidContributors = this.contributors.filter(contributor => !contributor.payment.paid);
  return unpaidContributors.length > 0 
    ? this.remainder / unpaidContributors.length 
    : this.remainder;
};

module.exports = {
  User: mongoose.model('User', userSchema),
  Contribution: mongoose.model('Contribution', contributionSchema),
  Payment: mongoose.model('Payment', paymentSchema),
  Item: mongoose.model('Item', itemSchema),
};
