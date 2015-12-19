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
		
		var find = function(req, res) {
			mongoose.connect(dbUrl);
			model[key].find().lean().exec(function(err, docs) {
				mongoose.disconnect();
				if (err) res.status(500).json({error: err});
				else res.json({docs: docs});
			});
		};
		e.get(baseUrl, find);

		var findById = function(req, res) {
			mongoose.connect(dbUrl);
			model[key].findById(req.params.id, function(err, doc) {
				mongoose.disconnect();
				if (err) res.status(500).json({error: err});
				else res.json({doc: doc});
			});
		};
		e.get(baseUrl + '/:id', findById);
	});

	return e;

}

module.exports = { router: router };