var express = require("express"),
    app = express(),
		server = require("http").createServer(app),
		io = require("socket.io").listen(server),
		_ = require("underscore");

app.use(express.static(__dirname + "/public"));

// TODO reids or something
var players = [];

app.get("/", function(request, response) {
	response.render('index.html');
});

io.sockets.on("connection", function(socket) {
	
	players.forEach(function(player) {
		socket.emit('player joined', player);
	});

	socket.on("player join", function(name) {
		var player = { id: socket.id ,name: name, x: 0, y: 0 };

		players.push(player);
		io.sockets.emit('player joined', player);
	});

	socket.on("disconnect", function() {
		var player = _.find(players, function(p) {
			return p.id == socket.id;
		});

		players = _.reject(players, function(p) {
			return p.id == player.id;
		});

		io.sockets.emit('player left', player);
	});
});



server.listen(process.env.PORT || 8383);