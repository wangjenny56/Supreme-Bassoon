var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var food_image = require('./Image');
var Buffer = require('buffer').Buffer

var imageSchema = new mongoose.Schema({
    name: String,
    img:
    {
        data: Buffer,
        contentType: String
    }
});

var userSchema = new Schema({
    username: String,
    password: String,
    restaurant_name: String, 
    cuisine: String, 
    customers_served: Number, 
    email: String, 
    phone_number: String, 
    location: {
        address: String, 
        city: String, 
        zipcode: String, 
        state: String
    }, 
    hours: {
        Monday: String, 
        Tuesday: String, 
        Wednesday: String, 
        Thursday: String, 
        Friday: String, 
        Saturday: String, 
        Sunday: String
    }, 
    listings: [
        {
            food_description: String,
            food_type: String, 
            quantity: Number, 
            perishability: Number, 
            pick_up_time: String, 
            availability_status: String, 
            picked_up_by: String,
            food_img: Object
        }
    ]
}); 

module.exports = mongoose.model('User', userSchema, "FakeData");

/*
{
   "username" : "jwang3",
   "password" : "password", 
   "restaurant_name" : "Pho Street",
   "cuisine" : "Vietnamese",
   "customers_served" : "0",
   "email" : "pho@gmail.com",
   "phone_number" : "610-526-7440", 
   "location" : {
       "address" : "101 N Merion Ave",
       "city" : "Bryn Mawr",
       "zipcode" : "19010",
       "state": "PA"
   },
   "hours": {
       "Monday" : "8:00AM - 10:00PM",
       "Tuesday" : "8:00AM - 10:00PM",
       "Wednesday" : "8:00AM - 10:00PM",
       "Thursday" : "8:00AM - 10:00PM",
       "Friday" : "8:00AM - 10:00PM",
       "Saturday" : "8:00AM - 12:00AM",
       "Sunday" : "8:00AM - 12:00AM"
   },
   "listings" : [
       {
           "food_description" : "Beef Pho",
           "food_type" : "Noodles",
           "quantity" : "1",
           "perishability" : "5 hours",
           "pick_up_time" : "",
           "availability_status" : "avaliable",
           "picked_up_by" : ""
       }
   ]
}

*/
