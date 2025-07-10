const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    trim: true
  },
  password_hash: {
    type: String,
    required: true,
    select: true
  },
  is_admin: {
    type: Boolean,
    default: false
  },
  deleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Create username from email before saving
userSchema.pre('save', function(next) {
  if (!this.username) {
    this.username = this.email.split('@')[0];
  }
  next();
});

// Static method to create user with hashed password
userSchema.statics.createUser = async function(email, password, isAdmin = false) {
  const username = email.split('@')[0];
  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = new this({
    email,
    username,
    password_hash: hash,
    is_admin: isAdmin
  });
  return await user.save();
};

// Static method to find user by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() }).select('+password_hash');
};

// Static method to find user by ID
userSchema.statics.findById = function(id) {
  return this.findOne({ _id: id });
};

// Static method to soft delete user
userSchema.statics.softDelete = function(id) {
  return this.findByIdAndUpdate(id, { deleted: true });
};

const User = mongoose.model('User', userSchema);

module.exports = User; 