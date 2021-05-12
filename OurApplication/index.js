// set up Express
var express = require('express');
var app = express();
var mongoose = require('mongoose')

// set up BodyParser
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true}));

app.use(bodyParser.json())

var fs = require('fs');
var path = require('path');
require('dotenv/config');
 
// Set EJS as templating engine
app.set("view engine", "ejs");
 
//setting up the connection 
mongoose.connect(process.env.MONGO_URL,
    { useNewUrlParser: true, useUnifiedTopology: true }, err => {
        console.log('Mongoose is connected!')
    });

// importing schemas
var User = require('./User.js');
const { collection, db } = require('./User.js');
var imgModel = require('./Image.js');

//images 
var multer = require('multer');
 
var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now())
    }
});
 
var upload = multer({ storage: storage });
/* --------------------------------------------END POINTS START----------------------------------------------*/



app.use('/all', (req, res) => {
	User.find({}, (error, result) => {
		if (error) {
			return console.log(`Error has occurred: ${error}`);
		}
		res.send(result)
	})
});


// endpoint for showing all the listings user has completed
app.use('/history', (req, res) => {

	var name = req.query.username;
	//read in username from URL

	User.findOne({ username: name }, function (err, document) {
		if (err) {
			res.type('html').status(404);
			console.log('uh oh' + err);
			res.write(err);
		}
		else if(!document){
			res.type('html').status(200);
			res.write('User not found.');
			// if undefined document, user not found
		}
		else{
			res.type('html').status(200);
			res.write("<html> <head>  <link rel=\"stylesheet\"  href=\"viewStyle.css\">	</head><body >" +
				" <h1>Thank you for your contributions! Here are your contributions so far:</h1>" +
				"<div id=\"myListings\" class=\"ML\" >");

			document.listings.forEach((listing) => {
				if (listing.availability_status == "not available"){
					res.write("<div class = \"listing\">" + listing.food_type + " : " + listing.food_description + "<br>");
					res.write("Quantity : " + listing.quantity + "<br>");
					res.write("Perishability : " + listing.perishability + "<br>");
					res.write("Picked up by " + listing.picked_up_by + " at " + listing.pick_up_time + "<br>");
					res.write("Order Completed!</p></div>");
				//send information for all listings in user if completed
				}
			});
			res.write("</div></body></html>");
		}
		res.end();
	}).sort({ 'pick_up_time': -1 }); //sorts in descending order for pick up time
});

app.get('/createDonation', (req, res) => {
    imgModel.find({}, (err, items) => {
        if (err) {
            console.log(err);
            res.status(500).send('An error occurred', err);
        }
        else {
            res.render('donationform', { items: items });
        }
    });
});

app.post('/createDonation', upload.single('image'), (req, res, next) => {
 
    var obj = {
        name: req.body.name,
        img: {
            data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
            contentType: 'image/png'
        }
    }

    imgModel.create(obj, (err, item) => {
        if (err) {
            console.log(err);
        }
    });

	var un = req.body.username; 
	var donationListing = {
		food_description: req.body.food_description,
		food_type: req.body.food_type,
		quantity: req.body.quantity,
		perishability: req.body.perishability,
		pick_up_time: req.body.pick_up_time,
		availability_status: "available",
		picked_up_by: req.body.picked_up_by,
	};

	User.findOneAndUpdate(
		{ username: un },
		{ $push: { "listings": donationListing } },

		function (error, success) {
			if (error) {
				res.send(error);

			}
			else {
				res.send("<html> <head>  <link rel=\"stylesheet\"  href=\"viewStyle.css\">	</head><body >" +
				" <h1>Successfully Added " + req.body.food_description + "!</h1>" +
				"<div id=\"myProfile\" class=\"ML\" >");
			}
		});


});

app.use('/viewAllListings', (req, res) => {
	var name = req.query.username;
	var currUser;
	User.findOne({ username: name }, function (err, curr) {
		if (err) {
			res.type('html').status(404);
			console.log('uh oh' + err);
			res.write(err);
		}
		else if(!curr){
			res.type('html').status(200);
			res.write('User not found.');
			// if undefined curr, user not found
		}else{
			currUser = curr; 
		}
	}); 

	User.find({}, (err, users) => {
		if (err) {
			res.type('html').status(200);
			console.log('uh oh' + err);
			res.write(err);
		}
		else {
			//no users
			if (users.length == 0) {
				res.type('html').status(200);
				res.write('There are no users');
				res.end();
				return;
			}
			else {
				res.type('html').status(200);

				res.write("<html> <head>  <link rel=\"stylesheet\"  href=\"viewStyle.css\">	</head><body >" +
				" <h1>All listings:</h1>" +
				"<div id=\"myListings\" class=\"ML\" >");

				res.write("<div class = \"usersListing\">" + "<h2>" + "Your current listings:" + "</h2>");
				res.write("</p></div>");

				currUser.listings.forEach((listing) => {
					if (listing.availability_status != "not available"){
						res.write("<div class = \"listing\">" + listing.food_type + " : " + listing.food_description + "<br>");
						res.write("Quantity : " + listing.quantity + "<br>");
						res.write("Perishability : " + listing.perishability + "<br>");
						res.write("Picked up by " + listing.picked_up_by + " at " + listing.pick_up_time + "<br>");
						res.write("</p></div>");
					//send information for all listings in user
					}
				});
				
				res.write("<div class = \"otherListings\">" + "<h2>" + "Other Resturant Listings:" + "</h2>");
				res.write("</p></div>");

				users.forEach((user) => {
					if(user.username != currUser.username){
						res.write("<div class = \"resturant\">" + "<h2> <center>" + "Resturant: " + user.restaurant_name + "<br>");
						res.write("Contact information: " + user.phone_number + " | " + user.email + "</center> </h2>" );
						res.write("</p></div>");
						user.listings.forEach((listing) => {
							if (listing.availability_status != "not available"){
								res.write("<div class = \"listing\">" + listing.food_type + " : " + listing.food_description + "<br>");
								res.write("Quantity : " + listing.quantity + "<br>");
								res.write("Perishability : " + listing.perishability + "<br>");
								res.write("Picked up by " + listing.picked_up_by + " at " + listing.pick_up_time + "<br>");
								res.write("</p></div>");
							//send information for all listings in user
							}
						});
						res.write("</div></body></html>");
				}
			})
				res.end();
			}
		}
	}).sort({ 'pick_up_time': -1 })

});

// endpoint for creating a new restaurant user
app.use('/createUser', (req, res) => {
	// construct the restaurant user from the form data which is in the request body
	var newUser = new User ({
		username: req.body.username,
		password: req.body.password,
		restaurant_name: req.body.restaurant_name,
		cuisine: req.body.cuisine,
		customers_served: req.body.customers_served,
		email: req.body.email,
		phone_number: req.body.phone_number,
		location: {
			address: req.body.address,
			city: req.body.city,
			zipcode: req.body.zipcode,
			state: req.body.state
		},
		hours: {
			Monday: req.body.monday,
			Tuesday: req.body.tuesday,
			Wednesday: req.body.wednesday,
			Thursday: req.body.thursday,
			Friday: req.body.friday,
			Saturday: req.body.saturday,
			Sunday: req.body.sunday
		},
		listings: []
	});
	// save the person to the database
	newUser.save((err) => {
		if (err) {
			res.type('html').status(200);
			res.write('uh oh: ' + err);
			console.log(err);
			res.end();
		}
		else {
			// display the "successfull created" message
			res.send("<html> <head>  <link rel=\"stylesheet\"  href=\"viewStyle.css\">	</head><body >" +
				" <h1>Successfully Added: " + newUser.username + " to the database!" + "</h1>" +
				"<div id=\"myListings\" class=\"ML\" >");
		}
	});
}
);

/* restaurant_name: req.body.restaurant_name,
		cuisine: req.body.cuisine,
		customers_served: req.body.customers_served,
		email: req.body.email,
		phone_number: req.body.phone_number,
		location: {
			address: req.body.address,
			city: req.body.city,
			zipcode: req.body.zipcode,
			state: req.body.state
		},
		hours: {
			Monday: req.body.monday,
			Tuesday: req.body.tuesday,
			Wednesday: req.body.wednesday,
			Thursday: req.body.thursday,
			Friday: req.body.friday,
			Saturday: req.body.saturday,
			Sunday: req.body.sunday
*/
// app.use('/editUser', (req, res) => {
// 	var name = req.query.username;
// 	var user = User.findOne({username:name});

// 	var restaurant_name= req.body.restaurant_name;
// 	var cuisine= req.body.cuisine;
// 	var customers_served= req.body.customers_served;
// 	var email= req.body.email;
// 	var phone_number= req.body.phone_number;
// 	var location {
// 			address: req.body.address,
// 			city: req.body.city,
// 			zipcode: req.body.zipcode,
// 			state: req.body.state
// 		},
// 	var hours= {
// 			Monday: req.body.monday,
// 			Tuesday: req.body.tuesday,
// 			Wednesday: req.body.wednesday,
// 			Thursday: req.body.thursday,
// 			Friday: req.body.friday,
// 			Saturday: req.body.saturday,
// 			Sunday: req.body.sunday
// 	}

// 	User.findOneAndUpdate(
// 		{ username: un },
// 		{ "$setOnInsert": 
// 			{
// 			restaurant_name: req.body.restaurant_name,
// 			cuisine: req.body.cuisine,
// 			customers_served: req.body.customers_served,
// 			email: req.body.email,
// 			phone_number: req.body.phone_number,
// 			location: {
// 				address: req.body.address,
// 				city: req.body.city,
// 				zipcode: req.body.zipcode,
// 				state: req.body.state
// 			},
// 			hours: {
// 				Monday: req.body.monday,
// 				Tuesday: req.body.tuesday,
// 				Wednesday: req.body.wednesday,
// 				Thursday: req.body.thursday,
// 				Friday: req.body.friday,
// 				Saturday: req.body.saturday,
// 				Sunday: req.body.sunday
// 			}
// 			}
	
// 		},
// 		{upsert: true},
// 		function (error, success) {
// 			if (error) {
// 				res.send(error);
// 			}
// 			else{

// 			}

// 	});

// 	var newUser = new User ({
// 		restaurant_name: req.body.restaurant_name,
// 		cuisine: req.body.cuisine,
// 		customers_served: req.body.customers_served,
// 		email: req.body.email,
// 		phone_number: req.body.phone_number,
// 		location: {
// 			address: req.body.address,
// 			city: req.body.city,
// 			zipcode: req.body.zipcode,
// 			state: req.body.state
// 		},
// 		hours: {
// 			Monday: req.body.monday,
// 			Tuesday: req.body.tuesday,
// 			Wednesday: req.body.wednesday,
// 			Thursday: req.body.thursday,
// 			Friday: req.body.friday,
// 			Saturday: req.body.saturday,
// 			Sunday: req.body.sunday
// 		},
// 		listings: []
// 	});
// 	res.send();
// });

app.use('/FrontEnd', express.static('FrontEnd'));
app.use('/createRestaurantUser', (req, res) => { res.redirect('/FrontEnd/Pages/restaurantuserform.html') });
app.use('/login', (req, res) => { res.redirect('/FrontEnd/Pages/loginform.html') });
app.use('/editProfile', (req, res) => { res.redirect('/FrontEnd/Pages/edituserform.html'+'?username=' + req.query.username); })

//5.1 View All Donation Listing Feed for Social Service
//Example: http://localhost:3000/viewListingsForSocialService?zipcode=19010
app.use('/viewListingsForSocialService', (req, res) => {
	var zipcode = req.query.zipcode; 
	if(zipcode === ''){ 
		User.find({"listings.availability_status": "avaliable"}, (error, result) => {
			if(error) {
				return console.log(`Error has occurred: ${error}`);
			}
			else{
				res.type('html').status(200);
				res.send(result)
				//res.send(result[0].listings);
			}
			
		})
	}else{
		User.find({"location.zipcode": zipcode, "listings.availability_status": "avaliable"}, (error, result) => {
			if(error) {
				return console.log(`Error has occurred: ${error}`);
			}
			else{
				res.type('html').status(200);
				res.send(result)
				//res.send(result[0].listings);
			}
			
		})
	}
});


app.use(express.static(__dirname));
var myListings = [];
app.use('/get', (req, res) => {


	var filter = { 'username': req.query.username };
	console.log(filter);
	User.findOne(filter, (err, result) => {
		if (err) {
			res.type('html').status(404);
		}
		else if (!result) {
			res.type('html').status(200);
			res.write("No such user");
			res.end();
		}
		else {
			console.log("successful");
			myListings = result.listings;
			console.log(myListings);
			res.type('html').status(200);
			res.write("<html> <head>  <link rel=\"stylesheet\"  href=\"viewStyle.css\">	</head><body >" +
				" <h1>Thank you for your contributions! Your offerings so far include:</h1>" +
				"<div id=\"myListings\" class=\"ML\" >");
			for (i = 0; i < myListings.length; i++) {
				res.write("<div class = \"listing\">" + myListings[i].food_type + " : " + myListings[i].food_description + "<br>");
				res.write("Quantity : " + myListings[i].quantity + "<br>");
				res.write("Perishability : " + myListings[i].perishability + "<br>");
				if (myListings[i].picked_up_by == "") {
					res.write("Has not been picked up yet <br>");
				}
				else {
					res.write("Picked up by " + myListings[i].picked_up_by + " at " + myListings[i].pick_up_time + "<br>");
				}
				res.write(myListings[i].availability_status + "</div>");

			}
			res.write("</div></body></html>");
			res.end();

		}
	});
});
app.use('/login', (req, res) =>{
	if(req.query.username==""||req.query.password==""){
        res.redirect('/emptylogin.html');
	}
	else{
		var filter = { 'username' : req.query.username };
    console.log(filter);
		User.findOne( filter, (err, result) => {
			if (err) {
				res.type('html').status(404);
				res.end();
			}
			else if(!result){
               res.redirect('/invalidusername.html')
			}
			else if(result.password!=req.query.password){
				res.redirect('/wrongpassword.html');
			}
			else{
				res.type('html').status(200);
				res.write("<html> <head>  <link rel=\"stylesheet\"  href=\"style.css\">	</head><body >"+
	" <h1>Hello, "+req.query.username+"! What would you like to do?</h1>"+
		  "<div class=\"container\" >");
		  res.write("<button id =\"view\" onclick=\"location.href = 'http://localhost:3000/get?username="+req.query.username+"';\" class = \"myButton\">"
		  +"View My Donation Listings</button>");
		  res.write("<button onclick=\"location.href = 'http://localhost:3000/createDonation?username="+req.query.username+"';\" class = \"myButton\">"+
		  "Create a Donation Listing</button>");
		  res.write("</div></body></html>");
		  res.end();
			}
		})
	
	}
});

app.use('/mainMenu', (req, res) =>{
	var name = req.body.username; 
	res.redirect('mainmenu.html?username='+name);
})

// This just sends back a message for any URL path not covered above
app.use('/test', (req, res) => {
	//return res.send('Default message.');  
	res.json({ 'status': 'It works!' })
});

//function to get username and pass to button url
function goToURL(param, url){
	var user = url.substring(url.indexOf('=')+1);
	if (param=='view'){
	   window.location ='http://localhost:3000/get?username='+user;
	}
	if (param=='post'){
	   window.location ='http://localhost:3000/createDonation?username='+user;
	}

	if (param=='edit'){
        window.location ='http://localhost:3000/editProfile?username='+user;
    }
}


app.use('/', (req, res) => {
	res.send('Default message.');
});

// This starts the web server on port 3000. 
app.listen(3000, () => {
	//Window.location.href = "http://localhost:3000/login"
	console.log('Listening on port 3000');
});
