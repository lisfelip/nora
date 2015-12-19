module.exports = {
	config: {
		host: 'localhost',
		name: 'example',
		user: 'root',
		password: ''
	},
	modeling: {
		player: {
			name: String,
			scores: {ref: 'score', rel: 'ManyToOne'}
		},
		game: {
			title: String,
			scores: {ref: 'score', rel: 'ManyToOne'}
		},
		score: {
			value: Number,
			player: {ref: 'player', rel: 'OneToMany', cascading: true},
			game: {ref: 'game', rel: 'OneToMany', cascading: true}
		}
	}
};

//nora.process(database);

/*

var 
	playerSchema = mongoose.Schema({
		name: String,
		scores: [{type: mongoose.Schema.Types.ObjectId, ref: 'Score'}]
	}),
	eventSchema = mongoose.Schema({
		title: String,
		scores: [{type: mongoose.Schema.Types.ObjectId, ref: 'Score'}]
	}),
	scoreSchema = mongoose.Schema({
		value: Number,
		playerId: {type: mongoose.Schema.Types.ObjectId, ref: 'Player'},
		eventId: {type: mongoose.Schema.Types.ObjectId, ref: 'Event'}
	});

var
	playerModel = mongoose.model('Player', playerSchema),
	eventModel = mongoose.model('Event', playerSchema),
	scoreModel = mongoose.model('Score', scoreSchema);

scoreSchema

	.pre('save', function(next, done) {
		// When you save a score, add it on nested player and event...
		var score = this;
		if (!score.playerId || !score.eventId) done();

		playerModel.findById(score.playerId, function(err, doc) {
			doc.scores.push(score._id);
			doc.save();
			eventModel.findById(score.eventId, function(err, doc) {
				doc.scores.push(score._id);
				doc.save();
				next();
			});
		});
	})

	.pre('remove', function(next, done) {
		// When you remove a score, remove it on nested player and event...
		var score = this;
		playerModel.findById(score.playerId, function(err, doc) {
			var index = doc.scores.indexOf(score._id);
			doc.scores.splice(index, 1);
			doc.save();
			eventModel.findById(score.eventId, function(err, doc) {
				index = doc.scores.indexOf(score._id);
				doc.scores.splice(index, 1);
				doc.save();
				next();
			});
		});
	});

var 
	pl = new playerModel({name: 'B'}),
	ev = new eventModel({title: 'Z'}),
	sc = new scoreModel({
		value: 44, 
		playerId: '567405b1951339d04ced6756',
		eventId: '5674048ad3c924504abffa70'
	});

	// score: 56740e459613f6d857c88009

if (true) {

	mongoose.connect(url);	

	if (false) {
		// All scores by a player...
		playerModel
			.findById('567405b1951339d04ced6756')
			.lean()
			.populate(['scores'])
			.exec(function(err, doc) {
				mongoose.disconnect();
			});
	} else if (false) {
		// All events by a player...
		playerModel
			.findById('567405b1951339d04ced6756')
			.lean()
			.populate(['scores'])
			.exec(function(err, doc) {
				var query = {$or: []};
				forEach(doc.scores, function(score) {
					query.$or.push({'_id': score.eventId});
				});
				eventModel
					.find(query)
					.lean()
					.exec(function(err, docs) {
						doc.events = docs;
						delete doc.scores;
						console.log(doc);
						mongoose.disconnect();
					});
			});
	} else if(false) {
		// Remove score by ID
		scoreModel.findById('56740e459613f6d857c88009', function(err, doc) {
			doc.remove(function(err, doc) {
				mongoose.disconnect();
			});
		});
	} else mongoose.disconnect();

}

*/