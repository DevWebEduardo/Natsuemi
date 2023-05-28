const connection = require('./db');

const modeSchema = new connection.Schema({
    name: {
        type: String,
        required: true
    },
});

const Mode = connection.model('mode', modeSchema);

module.exports = Mode;