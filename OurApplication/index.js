// set up Express
var express = require('express');
var app = express();

// set up BodyParser
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

// import the Person class from Person.js
var User = require('./User.js');
const { collection, db } = require('./User.js');

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

app.use('/createDonation', (req, res) => {
	var un = req.body.username; 
	var donationListing = {
		food_description: req.body.food_description,
		food_type: req.body.food_type,
		quantity: req.body.quantity,
		perishability: req.body.perishability,
		pick_up_time: req.body.pick_up_time,
		availability_status: "available",
		picked_up_by: req.body.picked_up_by
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
				" <h1>Successfully Added: " + donationListing.food_description + " to the database!" + "</h1>" +
				"<div id=\"myListings\" class=\"ML\" >");
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
	console.log(req.data.username);
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
			
			res.send('successfully added ' + newUser.username + ' to the database');
		}
	});
}
);

app.use('/FrontEnd', express.static('FrontEnd'));
//app.use('/postDonation', (req, res) => { res.redirect('/FrontEnd/Pages/donationform.html'); });
app.use('/postDonation', (req, res) => { res.redirect('/FrontEnd/Pages/donationform.html' + '?username=' + req.query.username); });
app.use('/createRestaurantUser', (req, res) => { res.redirect('/FrontEnd/Pages/restaurantuserform.html') });

//5.1 View All Donation Listing Feed for Social Service
//Example: http://localhost:3000/viewListingsForSocialService?zipcode=19010
app.use('/viewListingsForSocialService', (req, res) => {
	var zipcode = req.query.zipcode;
	User.find({ "location.zipcode": zipcode, "listings.availability_status": "avaliable" }, (error, result) => {
		if (error) {
			return console.log(`Error has occurred: ${error}`);
		}
		else {
			res.type('html').status(200);
			res.send(result)
			//res.send(result[0].listings);
		}

	})
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

// This just sends back a message for any URL path not covered above
app.use('/test', (req, res) => {
	//return res.send('Default message.');  
	res.json({ 'status': 'It works!' })
});

app.use('/', (req, res) => {
	res.send('Default message.');
});

// This starts the web server on port 3000. 
app.listen(3000, () => {
	console.log('Listening on port 3000');
});
