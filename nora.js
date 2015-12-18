var 
	mongoose = require('mongoose'),
	forEach = require('foreach'),
	url, model = {},
	oid = mongoose.Schema.Types.ObjectId;

function process(database) {
	
	var c = database.config;
	var m = database.modeling;

	url =  'mongodb://' + c.host + '/' + c.database;

	var schema = {};
	forEach(m, function(model, key) {
		forEach(model, function(attr, key) {
			if (typeof(attr) == 'object') {
				delete model[key];
				if (attr.rel === 'ManyToOne') {
					model[key] = [{type: oid, ref: attr.ref}];
				} else if (attr.rel === 'OneToMany') {
					model[key] = {type: oid, ref: attr.ref};
				}
			}
		});
		schema[key] = mongoose.Schema(model);
		model[key] = mongoose.model(key, schema[key]);
	});

}

module.exports = {
	process: process
};