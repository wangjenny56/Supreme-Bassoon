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
// const { collection, db } = require('./Image.js');

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
			res.send("<html> <head>  <link rel=\"stylesheet\"  href=\"viewStyle.css\">	</head><body >" +
			" <h1>Wrong user!</h1>");
			return;
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
	//only process image is there is an image
	if (req.file){
		var imgUser;
		var newFood = req.body.food_type + "/" + req.body.food_description;

		var obj = {
			username: req.body.username,
			food: newFood,
			img: {
				data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
				contentType: 'image/png'
			}
    	}
	}

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

		function (error, user) {
			if (error) {
				res.send(error);
				return;
			}
			else if (!user){
				res.send("<html> <head>  <link rel=\"stylesheet\"  href=\"viewStyle.css\">	</head><body >" +
				" <h1>No such user, Try again!</h1>");
				return;
			}
			else {
				res.redirect('/successfulListing' +'?username=' + req.body.username)
				return;
			}
		});
});

app.use('/successfulListing', (req, res) => {
	imgModel.find({username: req.query.username}, (err, items) => {
		if (err) {
			console.log(err);
			res.status(500).send('An error occurred', err);
		}
		else {
			res.render('successfulListing', { items: items});
		}
	});

});


app.use('/viewAllListings', (req, res) => {
	var name = req.query.username;
	var currUser;
	var image; 

	// imgModel.findOne({ username: "jwang6" }, function (err, curr) {
	// 	if (err) {
	// 		res.type('html').status(404);
	// 		console.log('uh oh' + err);
	// 		res.write(err);
	// 	}
	// 	else if(!curr){
	// 		res.type('html').status(200);
	// 		res.write('Photo not found.');
	// 		// if undefined curr, user not found
	// 	}else{
	// 		imgUser = curr; 
	// 	}
	// }); 

	// imgModel.find({}, (err, images) =>{
	// 	if (err) {
	// 		res.type('html').status(200);
	// 		console.log('uh oh' + err);
	// 		res.write(err);
	// 	}
	// 	else {
	// 		//no users
	// 		if (images.length == 0) {
	// 			res.type('html').status(200);
	// 			res.write('There are no photos');
	// 			res.end();
	// 			return;
	// 		}
	// 	else{
	// 		// console.log("AHHHHHH " + imgUser.img.contentType);

	// 		// var convert = imgUser.img.data.toString('base64');
	// 		// res.send('<img src="data:imgUser/<%=imgUser.img.contentType%>;base64,<%=' + convert + '%>"');

	// 		res.status(200).contentType("image/png").send(imgUser.img.data);
	// 		// imgUser_src = 'data:imgUser/jpeg;base64,' + Buffer.from(imgUser.img.data).toString('base64');
			
	// 		// res.send('<img>' + template + '</img>'); 
	// 		// res.render(imgUser_src);

	// 		// var your_binary_data = imgUser.img.data.replace(/(..)/gim,'%$1'); // parse text data to URI format

	// 		// window.open('data:image/jpeg;,'+your_binary_data);
			
	// 	}
	// }
	// }); 
		
	User.findOne({ username: name }, function (err, curr) {
		if (err) {
			res.type('html').status(404);
			console.log('uh oh' + err);
			res.write(err);
		}
		else if(!curr){
			res.type('html').status(200);
			res.redirect('/invalidusername.html')
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

					var food_name = listing.food_type + "/" + listing.food_description
					imgModel.findOne({ username: name, food: food_name}, function (err, curr) {
						if (!err && curr){
							image = curr; 
							console.log(image.food);
							// imgUser_src = 'data:image/jpeg;base64,' + Buffer.from(image.img.data).toString('base64');
							// res.send('<img>' + imgUser_src + '</img>');
							// res.status(200).contentType("image/png").send(image.img.data);
							// var convert = image.img.data.toString('base64');
							// res.write('<img src="data:image/<%=image.img.contentType%>;base64,<%=' + convert + '%>">');
						}
						
					});
					

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

							var food_name = listing.food_type + "/" + listing.food_description
							imgModel.findOne({ username: name, food : food_name}, function (err, curr) {
								if (!err && curr){
									image = curr; 
									console.log(image.food);
									// imgUser_src = 'data:image/jpeg;base64,' + Buffer.from(image.img.data).toString('base64');
									// res.write('<img>' + imgUser_src + '</img>');
									// res.status(200).contentType("image/png").send(image.img.data);
									// var convert = image.img.data.toString('base64');
									// res.write('<img src="data:image/<%=image.img.contentType%>;base64,<%=' + convert + '%>">');
								}
							}); 
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

	var newUser = new User({
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
			res.send("<html> <head>  <link rel=\"stylesheet\"  href=\"viewStyle.css\">	</head><body >" +
				" <h1>Error in saving, Try again!</h1>");
			res.end();
		}
		else {
			// display the "successfull created" message
			res.send("<html> <head>  <link rel=\"stylesheet\"  href=\"viewStyle.css\">	</head><body >" +
				" <h1>Successfully Added: " + newUser.username + " to the database!" + "</h1>" +
				"<div id=\"myListings\" class=\"ML\" >");
		}
	});
});

mongoose.set('useFindAndModify', false);
app.use('/editUser', (req, res) => {
	//boolean to keep track if fields were typed in
	var edit = 'false'
	var name = req.body.username;
	var filter = { 'username': name };
	//create empty fields
	var restaurant_name;
	var cuisine;
	var customers_served;
	var email;
	var phone_number;
	var location = {
		address: "",
		city: "",
		zipcode: "",
		state: ""
	};
	var hours = {
		Monday: "",
		Tuesday: "",
		Wednesday: "",
		Thursday: "",
		Friday: "",
		Saturday: "",
		Sunday: ""
	};

	//find user based on inputted username
	User.findOne(filter,
		(err, user) => {
			if (err) {
				res.type('html').status(404);
				res.end();
			}
			else if (!user) {
				res.type('html').status(200);
				res.send("<html> <head>  <link rel=\"stylesheet\"  href=\"viewStyle.css\">	</head><body >" +
				" <h1>No user found. Try Again!</h1>");
				res.end();
			}
			else {
				res.type('html').status(200);
				//first set all fields to existing values
				restaurant_name = user.restaurant_name;
				cuisine = user.cuisine;
				customers_served = user.customers_served;
				email = user.email;
				phone_number = user.phone_number;
				location = {
					address: user.location.address,
					city: user.location.city,
					zipcode: user.location.zipcode,
					state: user.location.state
				}
				hours = {
					Monday: user.hours.Monday,
					Tuesday: user.hours.Tuesday,
					Wednesday: user.hours.Wednesday,
					Thursday: user.hours.Thursday,
					Friday: user.hours.Friday,
					Saturday: user.hours.Saturday,
					Sunday: user.hours.Sunday
				}
				//check each field if user entered in form
				if (req.body.restaurant_name) {
					restaurant_name = req.body.restaurant_name;
					edit = 'true';
				}
				if (req.body.cuisine) {
					cuisine = req.body.cuisine;
					edit = 'true';
				}
				if (req.body.customers_served) {
					customers_served = req.body.customers_served;
					edit = 'true';
				}
				if (req.body.email) {
					email = req.body.email;
					edit = 'true';
				}
				if (req.body.phone_number) {
					phone_number = req.body.phone_number;
					edit = 'true';
				}
				if (req.body.address) {
					location.address = req.body.address;
					edit = 'true';
				}
				if (req.body.city) {
					location.city = req.body.city;
					edit = 'true';
				}
				if (req.body.zipcode) {
					location.zipcode = req.body.zipcode;
					edit = 'true';
				}
				if (req.body.state) {
					location.state = req.body.state;
					edit = 'true';
				}
				if (req.body.monday) {
					hours.Monday = req.body.monday;
					edit = 'true';
				}
				if (req.body.tuesday) {
					hours.Tuesday = req.body.tuesday;
					edit = 'true';
				}
				if (req.body.wednesday) {
					hours.Wednesday = req.body.wednesday;
					edit = 'true';
				}
				if (req.body.thursday) {
					hours.Thursday = req.body.thursday;
					edit = 'true';
				}
				if (req.body.friday) {
					hours.Friday = req.body.friday;
					edit = 'true';
				}
				if (req.body.saturday) {
					hours.Saturday = req.body.saturday;
					edit = 'true';
				}
				if (req.body.sunday) {
					hours.Sunday = req.body.sunday;
					edit = 'true';
				}

				if(edit=='false'){
					res.write("<html> <head>  <link rel=\"stylesheet\"  href=\"viewStyle.css\">	</head><body >" +
							" <h1>Please edit " + user.username + "'s profile!" + "</h1>" );
					return;
				}
				//update using variables, if user entered value it will be 
				//user value, if not, it is existing value
				User.findOneAndUpdate(
					filter,
					{$set: {
						"restaurant_name": restaurant_name,
						"cuisine": cuisine,
						"customers_served": customers_served,
						"email": email,
						"phone_number": phone_number,
						"location.address": location.address,
						"location.city": location.city,
						"location.zipcode": location.zipcode,
						"location.state": location.state,

						"hours.Monday": hours.Monday,
						"hours.Tuesday": hours.Tuesday,
						"hours.Wednesday": hours.Wednesday,
						"hours.Thursday": hours.Thursday,
						"hours.Friday": hours.Friday,
						"hours.Saturday": hours.Saturday,
						"hours.Sunday": hours.Sunday
					}},
					function (error, user) {
						if (error) {
							res.type('html').status(404);
							res.send(error);
						}
						if (!user) {
							res.write("<html> <head>  <link rel=\"stylesheet\"  href=\"viewStyle.css\">	</head><body >" +
							" <h1>No such user, Try again!</h1>" );
						}
						else {
							res.write("<html> <head>  <link rel=\"stylesheet\"  href=\"viewStyle.css\">	</head><body >" +
							" <h1>Successfully Edited " + user.username + "'s profile!" + "</h1>" );
							//ar loginURL = "http://localhost:3000/login?username="+name;
							// setTimeout(function() {
							// 	//window.location = loginURL;
							// 	res.redirect('/login?username='+name);
							// }, 500)
							return;
						}

					});
			}
		}
	);
});

app.use('/FrontEnd', express.static('FrontEnd'));
app.use('/createRestaurantUser', (req, res) => { res.redirect('/FrontEnd/Pages/restaurantuserform.html') });

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

//5.4 Create and Post Donation Listing for Social Service
app.use('/addDonationForSocialService', (req, res) => {
	console.log(req.body);
	var donation = {
		"food_description": req.body.foodDescription,
		"food_type": req.body.foodType,
		"quantity": Number(req.body.quantity),
		"perishability": Number(req.body.perishability),
		"pick_up_time": req.body.pickUpTime,
		"availability_status": "available",
		"picked_up_by": ""
	};

		
	User.findOneAndUpdate(
	{ social_service_name: req.body.socialService },
	{$push: {"listings": donation}},
	function (error, success) {
		if (error) {
			res.send("fail");
		} else {
			res.send("done");
		}
	});
	
});


app.use(express.static(__dirname));
var myListings = [];
app.use('/get', (req, res) =>{
	
	
    var filter = { 'username' : req.query.username };
    console.log(filter);
User.findOne( filter, (err, result) => {
if (err) {
	res.type('html').status(404);
}
else if (!result) {
	res.type('html').status(200);
	res.send("<html> <head>  <link rel=\"stylesheet\"  href=\"viewStyle.css\">	</head><body >" +
	" <h1>No such user!</h1>");
  res.end();
}
else {
	console.log("successful");
	myListings=result.listings;
	console.log(myListings);
	res.type('html').status(200);
	res.write("<html> <head>  <link rel=\"stylesheet\"  href=\"style.css\">	</head><body >"+
	" <h1>Thank you for your contributions! Your offerings so far are:</h1>"+"<div class=\"sidenav\">"+
	"<a href=\"#\" onclick=\"location.href = 'http://localhost:3000/history?username="+req.query.username+"';\" >My history</a>"+
	"<a href=\"#\" onclick=\"location.href = 'http://localhost:3000/editProfile?username="+req.query.username+"';\" >Edit profile</a>"+
	"<a href=\"#\"  onclick=\"location.href = 'http://localhost:3000/start';\">Sign out</a>"+
	"</div>"+
		  "<div id=\"myListings\" class=\"ML\" >");
		  for( i=0;i<myListings.length;i++){
			  if(!myListings[i].food_type||!myListings[i].quantity){
			  }
			  else{
			  res.write("<div class = \"listing\">"+myListings[i].food_type+" : "+myListings[i].food_description+"<br>");
            res.write("Quantity : "+myListings[i].quantity+"<br>");
			res.write("Perishability : "+myListings[i].perishability+"<br>");
			if(myListings[i].picked_up_by==""){
                res.write("Has not been picked up yet <br>");
			}
			else{
				//res.write("Has not been picked up yet <br>");
			res.write("Picked up by "+myListings[i].picked_up_by +" at "+myListings[i].pick_up_time+"<br>");
			}
			res.write(myListings[i].availability_status+"</div>");
		}
	}
		  
		  res.write("</div></body></html>");
		  res.end();

}});


});
app.use('/takemetologin', (req, res) =>{
        res.redirect('/login.html');
	
});
app.use('/start', (req, res) =>{
	res.redirect('/start.html');

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
	" <h1>Hello, "+req.query.username+"! What would you like to do?</h1> <div class=\"sidenav\">"+
	"<a href=\"#\" onclick=\"location.href = 'http://localhost:3000/history?username="+req.query.username+"';\" >My history</a>"+
	"<a href=\"#\" onclick=\"location.href = 'http://localhost:3000/editProfile?username="+req.query.username+"';\" >Edit profile</a>"+
	"<a href=\"#\"  onclick=\"location.href = 'http://localhost:3000/start';\">Sign out</a>"+
	"</div>"
  +"<div class=\"container\" >");
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
