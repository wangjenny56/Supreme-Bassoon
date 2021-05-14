var mongoose = require('mongoose');
var Schema = mongoose.Schema;
 
var imageSchema = new mongoose.Schema({
    username: String,
    food: String,
    img:
    {
        data: Buffer,
        contentType: String
    }
});

module.exports = new mongoose.model('Image', imageSchema, "images");
