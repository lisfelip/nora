var 
	mongoose = require('mongoose'),
	express = require('express'),
	forEach = require('foreach'),
	process = require('./_process');

module.exports = function route(database) {

	var 
		c = database.config,
		e = express(),
		p = process(database),
		model = p.model,
		dbUrl = p.dbUrl,
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
					var obj = JSON.parse(req.body[key]);
					if (obj._id) {
						model[key].findById(obj._id, function(err, doc) {
							if (err) res.status(500).json({error: err});
							forEach(obj, function(val, key) { doc[key] = val; });
							doc.__v++;
							doc.save(response(res));
						});
					} else {
						(new model[key](obj)).save(response(res));
					} 
				} catch(err) {
					res.status(500).json({error: {message: "Invalid object sent"}});
				}
			}
		};
		var remove = function(req, res) {
			mongoose.connect(dbUrl);
			model[key].find(req.query, function(err, doc) {
				if (err) res.status(500).json({error: err});
				doc.remove(response(res));
			});
		};
		var removeById = function(req, res) {
			if (!req.params.id)
				res.status(500).json({error: {message: 'No ID sent'}});
			else {
				mongoose.connect(dbUrl);
				model[key].findById({"_id": req.params.id}, function(err, doc) {
					if (err) res.status(500).json({error: err});
					doc.remove(response(res));
				});
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

};