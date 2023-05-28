const connection = require('./db');

const userSchema = new connection.Schema({
  user: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
});

const User = connection.model('user', userSchema);

module.exports = User;