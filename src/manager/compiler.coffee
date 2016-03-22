Sequelize = require "sequelize"
db = require "./../config/database.json"
	.test

sequelize = new Sequelize db.database, db.username, db.password, db

compile = (model)->
	def = {}
	for table, data of model
		for field, attr of data.fields
			attr.type = eval "Sequelize.#{attr.type}"
		def[table] = sequelize.define table, data.fields, {freezeTableName: true}

	for table, data of model
		for field, attr of data.rel
			if attr.type is "oneToMany"
				def[table].hasMany def[field]
			else if attr.type is "manyToMany"
				for f, a of attr.assoc.fields
					a.type = eval "Sequelize.#{a.type}"
				if not attr.assoc.fields
					attr.assoc.fields = {}
				attr.assoc.fields.id = {type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true}
				def[attr.assoc.name] = sequelize.define attr.assoc.name, attr.assoc.fields, {freezeTableName: true}
				def[table].belongsToMany def[field], {through: {model: def[attr.assoc.name]}}
				def[field].belongsToMany def[table], {through: {model: def[attr.assoc.name]}}

	sequelize.sync()
	def

module.exports = {
	compile: compile
}