Sequelize = require "sequelize"
db = require "./../config/database.json"
	.test

sequelize = new Sequelize db.database, db.username, db.password, db

compile = (model)->
	def = {}
	for table, row of model
		for col, attr of row
			attr.type = eval "Sequelize.#{attr.type}"
		def[table] = sequelize.define table, row, {
			freezeTableName: true
		}
	def

module.exports = {
	compile: compile
}