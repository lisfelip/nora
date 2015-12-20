var 
	mongoose = require('mongoose'),
	express = require('express'),
	forEach = require('foreach'),
	oid = mongoose.Schema.Types.ObjectId;

module.exports = function process(database) {
	
	var 
		c = database.config,
		m = database.modeling,
		model = {},
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

	return {model: model, dbUrl: dbUrl};

}