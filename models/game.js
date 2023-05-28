const connection = require('./db');

const gameSchema = new connection.Schema({
    page: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    image:{
        type: String,
        required: true
    },
    categorie: [{
        type:String
    }],
    platform: [{
        type:String
    }],
    mode: [{
        type:String
    }],
    date:{
        type:Date,
        default: Date.now,
    }
});

const Game = connection.model('game', gameSchema);

module.exports = Game;