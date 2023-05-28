const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/natsuemi', {
    useNewUrlParser:true,
    useUnifiedTopology: true,
}).catch((error) => {
    console.log("Error: " + error);
});

module.exports = mongoose;