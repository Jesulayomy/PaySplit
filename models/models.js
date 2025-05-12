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
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
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
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [itemSchema],
  invites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  contributors: [paymentSchema],
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
  const unpaidContributors = this.contributors.filter(payment => !payment.paid);
  return unpaidContributors.length > 0 
    ? (this.remainder / unpaidContributors.length ).toFixed(2)
    : this.remainder.toFixed(2);
};

contributionSchema.methods.equalTax = function() {
  return (this.tax / this.contributors.length ).toFixed(2);
};

contributionSchema.methods.equalTip = function() {
  return (this.tip / this.contributors.length ).toFixed(2);
};

module.exports = {
  User: mongoose.model('User', userSchema),
  Contribution: mongoose.model('Contribution', contributionSchema),
  Payment: mongoose.model('Payment', paymentSchema),
  Item: mongoose.model('Item', itemSchema),
};
