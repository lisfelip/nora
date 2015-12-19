var
	express = require('express'),
	path = require('path'),
	bodyParser = require('body-parser'),
	crypto = require('crypto-js'),
	nora = require('./nora'),
	database = require('./database');

activate();

function activate() {

	var
		ipaddress = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1',
		port = process.env.OPENSHIFT_NODEJS_PORT || 8084,
		app = express();

	app
		.use(function(req, res, next) {
			res.header('Access-Control-Allow-Origin', '*');
			res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
		    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
			next();
		})
	    .use(bodyParser.json())
	    .use(bodyParser.urlencoded({extended: true}));

	app.use(nora.router(database));

	app
		.get('/', function(req, res) { res.sendFile(path.resolve('public/index.html')); })
		.use(function(req, res) { res.redirect('/'); })
		.listen(port, ipaddress, function() {
			console.log('Listening to 8084...');
		});

}
