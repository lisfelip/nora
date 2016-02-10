gulp = require 'gulp'
jade = require 'gulp-jade'
sass = require 'gulp-sass'
coffee = require 'gulp-coffee'
plumber = require 'gulp-plumber'
nodemon = require 'gulp-nodemon'

glob = {
	coffee: './src/**/*.coffee'
	sass: './src/**/*.scss'
	jade: './src/**/*.jade'
	files2Copy: ['./src/**/{!(*.coffee|*.scss|*.jade), *.*}']
}

gulp.task 'copy-files', ()->
	gulp.src glob.files2Copy
		.pipe gulp.dest './server/'

gulp.task 'coffee', ()->
	gulp.src glob.coffee
		.pipe plumber()
		.pipe coffee {bare: true}
		.pipe gulp.dest './server/'
		
gulp.task 'sass', ()->
	gulp.src glob.sass
		.pipe plumber()
		.pipe sass {outputStyle: 'expanded'}
		.pipe gulp.dest './server/'

gulp.task 'jade', ()->
	gulp.src glob.jade
		.pipe plumber()
		.pipe jade {pretty: true}
		.pipe gulp.dest './server/'
	
gulp.task 'watch', ()->
	gulp.watch glob.coffee, ['coffee']
	gulp.watch glob.sass, ['sass']
	gulp.watch glob.jade, ['jade']

gulp.task 'nodemon', ['build', 'watch'], ()->
	nodemon {script: './server/index.js'}

gulp.task 'build', ['copy-files', 'coffee', 'sass', 'jade']

gulp.task 'default', ['nodemon']