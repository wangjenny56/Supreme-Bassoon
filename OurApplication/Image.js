var mongoose = require('mongoose');
var Schema = mongoose.Schema;
 
var imageSchema = new mongoose.Schema({
    name: String,
    desc: String,
    img:
    {
        data: Buffer,
        contentType: String
    }
});

module.exports = imageSchema;