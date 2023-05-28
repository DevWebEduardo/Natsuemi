const connection = require('./db');

const platformSchema = new connection.Schema({
    name: {
        type: String,
        required: true
    },
});

const Platform = connection.model('platform', platformSchema);

module.exports = Platform;