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
			delete entity[key];
			if (typeof attr == 'string') {
				var e = eval(attr);
				if (typeof e == 'function')	entity[key] = e;
			} else {
				if (attr.rel === 'ManyToOne')
					entity[key] = [{type: oid, ref: attr.ref}];
				else if (attr.rel === 'OneToMany')
					entity[key] = {type: oid, ref: attr.ref};
			}
		});
		model[key] = mongoose.model(key, mongoose.Schema(entity));
	});

	return model;

}

function route(database) {

	var 
		c = database.config,
		e = express(),
		model = process(database),		
		response = function(res) {
			return function(err, data) {
				mongoose.disconnect();
				if (err) res.status(500).json({error: err});
				else res.json({data: data});
			};
		};

	forEach(model, function(m, key) {
		var baseUrl = '/' + c.name + '/' + key;

		var find = function(req, res) {
			mongoose.connect(dbUrl);
			model[key].find(req.query).lean().exec(response(res));
		};
		var findById = function(req, res) {
			if (!req.params.id)
				res.status(500).json({error: {message: 'No ID sent'}});
			else {
				mongoose.connect(dbUrl);
				model[key].findById(req.params.id, response(res));
			}
		};
		var save = function(req, res) {
			if (!req.body[key]) 
				res.status(500).json({error: {message: 'No object sent'}});
			else {
				try {
					mongoose.connect(dbUrl);
					var obj = new model[key](JSON.parse(req.body[key]));
					obj.save(response(res));
				} catch(err) {
					res.status(500).json({error: {message: "Invalid object sent"}});
				}
			}
		};
		var remove = function(req, res) {
			mongoose.connect(dbUrl);
			model[key].remove(req.query, response(res));
		};
		var removeById = function(req, res) {
			if (!req.params.id)
				res.status(500).json({error: {message: 'No ID sent'}});
			else {
				mongoose.connect(dbUrl);
				model[key].remove({"_id": req.params.id}, response(res));
			}
		};

		e
			.get(baseUrl, find)
			.get(baseUrl + '/:id', findById)
			.post(baseUrl, save)
			.delete(baseUrl, remove)
			.delete(baseUrl + '/:id', removeById);
	});

	return e;

}

module.exports = { route: route };