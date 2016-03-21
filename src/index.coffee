express = require "express"
bodyParser = require "body-parser"
manager = require "./manager/core"

http = require "./config/http.json"

if (process.env.OPENSHIFT_NODEJS_IP) 
	http.host = process.env.OPENSHIFT_NODEJS_IP
if (process.env.OPENSHIFT_NODEJS_PORT)
	http.port = process.env.OPENSHIFT_NODEJS_PORT

app = express()

app
	.use (req, res, next)->
		res.header "Access-Control-Allow-Origin", "*";
		next()
	.use bodyParser.json()
	.use bodyParser.urlencoded({extended: true})

routes = manager.route "library"
app.use routes

app
	.use "/", express.static "./server/public"
	.use (req, res)->
		res.redirect("/")
	.listen http.port, http.host, ()->
		console.log "Listening to #{http.host}:#{http.port}..."