express = require "express"
each = require "foreach"
compiler = require "./compiler"

route = (database)->
	model = require "./../models/#{database}.json"
	seq = compiler.compile(model)
	routes = express()

	findAll = (table, obj)->
		(req, res)->
			obj.findAll({where: req.query})
				.then (data)->
					res.json {success: true, data: data}

	findById = (table, obj)->
		(req, res)->
			obj.findById(req.params.id)
				.then (data)->
					if data
						res.json {success: true, data: data}
					else
						res.json {success: false, message: "ID not found"}

	create = (table, obj)->
		(req, res)->
			obj.sync()
				.then ->
					delete req.body.id
					obj.create(req.body)
					res.json {success: true, data: req.body}

	update = (table, obj)->
		(req, res)->
			obj.findById(req.body.id)
				.then (data)->
					if data
						data.update(req.body)
							.then ->
								res.json {success: true, data: data}
					else
						res.json {success: false, message: "ID not found"}

	remove = (table, obj)->
		(req, res)->
			obj.findById(req.params.id)
				.then (data)->
					if data
						data.destroy()
							.then ->
								res.json {success: true, data: data}
					else
						res.json {success: false, message: "ID not found"}

	for table, obj of seq	
		routes.get "/#{database}/#{table}", findAll(table, obj)
		routes.get "/#{database}/#{table}/:id", findById(table, obj)
		routes.post "/#{database}/#{table}", create(table, obj)
		routes.put "/#{database}/#{table}", update(table, obj)
		routes.delete "/#{database}/#{table}/:id", remove(table, obj)
					
	routes

module.exports = {
	route: route
}