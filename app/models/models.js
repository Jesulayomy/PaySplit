const mongoose = require('mongoose');
const bcrypt   = require('bcrypt');
const { Schema } = mongoose;


const userSchema = new Schema({
  firstName: String,
  lastName: String,
  imgURL: String,
  email: String,
  password: String,
});

const paymentSchema = new Schema({
  amount: Number,
  user: userSchema,
  paid: Boolean,
});

const contributionSchema = new Schema({
  name: String,
  description: String,
  amount: Number,
  tax: Number,
  tip: Number,
  total: Number,
  equal: Boolean,
  date: Date,
  completed: Boolean,
  owner: userSchema,
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
  return (this.amount + this.tax + this.tip) / this.contributors.length
};

module.exports = {
  User: mongoose.model('User', userSchema),
  Contribution: mongoose.model('Contribution', contributionSchema),
  Payment: mongoose.model('Payment', paymentSchema),
};
