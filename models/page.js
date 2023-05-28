const connection = require('./db');

const pageSchema = new connection.Schema({
    name: {
      type: String,
      required: true
    },
    platforms: [{
      type: String,
      ref: 'Plataform'
    }],
  });

const Page = connection.model('page', pageSchema);

module.exports = Page;