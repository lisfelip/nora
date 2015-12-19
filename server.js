var
	bodyParser = require('body-parser'),
	express = require('express'),
	forEach = require('foreach'),
	glob = require('glob'),
	jsonfile = require('jsonfile'),
	path = require('path'),
	nora = require('./nora');

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

	glob('./apps/**/*.json', undefined, function(err, files) {
		forEach(files, function(file) {	var i = 0;
			jsonfile.readFile(file, function(err, database) {
				app.use(nora.route(database));
				if (++i == files.length) {
					app
						.get('/', function(req, res) { res.sendFile(path.resolve('apps/index.html')); })
						.use(function(req, res) { res.redirect('/'); })
						.listen(port, ipaddress, function() {
							console.log('Listening to 8084...');
						});
				}
			});
		});
	});

}