var 
	mongoose = require('mongoose'),
	express = require('express'),
	forEach = require('foreach'),
	model = {}, dbUrl,
	oid = mongoose.Schema.Types.ObjectId;

function process(database) {
	
	var c = database.config;
	var m = database.modeling;

	dbUrl =  'mongodb://' + c.host + '/' + c.name;

	forEach(m, function(entity, key) {
		forEach(entity, function(attr, key) {
			if (typeof(attr) == 'object') {
				delete entity[key];
				if (attr.rel === 'ManyToOne') {
					entity[key] = [{type: oid, ref: attr.ref}];
				} else if (attr.rel === 'OneToMany') {
					entity[key] = {type: oid, ref: attr.ref};
				}
			}
		});
		model[key] = mongoose.model(key, mongoose.Schema(entity));
	});

	return model;

}

function router(database) {

	var c = database.config;
	var e = express();
	var model = process(database);

	forEach(model, function(m, key) {
		var baseUrl = '/' + c.name + '/' + key;
		
		var defaultResponse = function(res) {
			return function(err, data) {
				mongoose.disconnect();
				if (err) res.status(500).json({error: err});
				else res.json({data: data});
			};
		};

		var find = function(req, res) {
			mongoose.connect(dbUrl);
			model[key].find().lean().exec(defaultResponse(res));
		};
		e.get(baseUrl, find);

		var findById = function(req, res) {
			mongoose.connect(dbUrl);
			model[key].findById(req.params.id, defaultResponse(res));
		};
		e.get(baseUrl + '/:id', findById);

		var save = function(req, res) {
			mongoose.connect(dbUrl);
			var object = new model[key](req.body.object);
			object.save(defaultResponse(res));
		};
		e.post(baseUrl, save);
	});

	return e;

}

module.exports = { router: router };