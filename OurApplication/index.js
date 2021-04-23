// set up Express
var express = require('express');
var app = express();

// set up BodyParser
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

// import the Person class from Person.js
var User = require('./User.js');

app.use('/all', (req, res) => {
	User.find({}, (error, result) => {
		if(error) {
		return console.log(`Error has occurred: ${error}`);
		}
		res.send(result)
	})
});

// endpoint for showing all the listings
app.use('/history', (req, res) => {
    
	// find all the User objects in the database
	User.find( {}, (err, users) => {
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
			users.forEach( (user) => {
				if (user.username == "jwang3"){
					//currently only for jenny (search for 1 user)
					user.listings.forEach((listing) =>{
						res.write('<li>Food Description: ' + listing.food_description + 
						'; Food Type: ' + listing.food_type + '; Food Quantity: ' + listing.quantity +
						'; Perishability: ' + listing.perishability + '; Pick Up Time: ' + 
						listing.pick_up_time + '; Pick Up By: ' + listing.picked_up_by + '</li>');
							//send information for all listings in user
			   		});
				}
				else{
					res.write('User not found.');
				}
			})
			res.write('</ul>');
			res.end();
		    }
		}
	    }).sort({ 'pick_up_time': -1 }); //sorts in descending order BEFORE rendering the results
    });

app.use('/createDonation', (req, res) => {

	var donationListing = new User ({
		food_description: req.body.food_description,
		food_type: req.body.food_type,
		quantity: req.body.quantity,
		perishability: req.body.perishability,
		pick_up_time: req.body.pick_up_time,
		picked_up_by: req.body.picked_up_by,
	    });

		donationListing.save( (err) => { 
			if (err) {
				res.type('html').status(200);
				res.write('uh oh: ' + err);
				console.log(err);
				res.end();
			}
			else {
				// display the "successfull created" message
				res.send('successfully added ' + donationListing.food_type + ' to the database');
			}
			} ); 

		// res.write("Food Description is: " + food_description);
	
});

app.use('/FrontEnd', express.static('FrontEnd'));
app.use('/post', (req, res) => { res.redirect('/FrontEnd/Pages/donationform.html'); } );

// This just sends back a message for any URL path not covered above
app.use('/test', (req, res) => {
	//return res.send('Default message.');  
    res.json({ 'status' : 'It works!' })
});

app.use('/', (req, res) => {
	res.send('Default message.');
});

// This starts the web server on port 3000. 
app.listen(3000, () => {
	console.log('Listening on port 3000');
});
