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
