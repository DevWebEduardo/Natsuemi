const connection = require('./db');

const categorieSchema = new connection.Schema({
    name: {
        type: String,
        required: true
    },
});

const Categorie = connection.model('categorie', categorieSchema);

module.exports = Categorie;