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
		var cascade = [];
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
				if (attr.cascade) cascade.push({ref: attr.ref, attr: attr.cascade, rel: attr.rel});
			}
		});
		var schema = mongoose.Schema(entity);
		model[key] = mongoose.model(key, schema);
		if (cascade.length) {
			schema
				.pre('save', function(next, done) {
					var 
						obj = this,
						save = function(idx) {
							if (idx == cascade.length) next();
							else {
								if (cascade[idx].rel == 'ManyToOne') save(++idx);
								else {
									var glass = true;
									if (idx === 0)
										for(var i = 0; i < cascade.length && glass; i++)
											if(!obj[cascade[i].ref]) { glass = false; done(); }
									if (glass) {
										var cur = cascade[idx];
										model[cur.ref].findById(obj[cur.ref], function(err, doc) {
											if (err) done();
											else {
												doc[cur.attr].push(obj._id);
												doc.save(function(err, doc) { if (err) done(); else save(++idx); });
											}
										});
									}
								}
							}
						}; 

					model[key].findById(obj._id, function(err, doc) {
						if (doc) 
							doc.remove(function(err, doc) {
								(new model[key](obj)).save(function() { done(); });
							});
						else save(0);
					});
				})
				.pre('remove', function(next, done) {
					var 
						obj = this,
						remove = function(idx) {
							if (idx == cascade.length) next();
							else {
								var cur = cascade[idx];
								if (cur.rel == 'ManyToOne') {
									var query = {$or: []};
									forEach(obj[cur.attr], function(item) {	query.$or.push({'_id': item}); });
									model[cur.ref].remove(query, function(err, doc) { next(); });
								} else {
									model[cur.ref].findById(obj[cur.ref], function(err, doc) {
										var i = doc[cur.attr].indexOf(obj._id);
										doc[cur.attr].splice(i, 1);
										doc.save(function(err, doc) { if (err) done(); else remove(++idx); });
									});
								}
							}
						}; remove(0);
				});
		}
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

}

module.exports = { route: route };