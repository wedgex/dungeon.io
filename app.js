var express = require("express"),
    app = express(),
		server = require("http").createServer(app),
		io = require("socket.io").listen(server),
		_ = require("underscore");

app.use(express.static(__dirname + "/public"));

// TODO reids or something
var players = [];

var randomColor = function() {
	var colors = ['#1b1224', '#dd0000', '#e52d00', '#007fff', '#014421', '#4d2177', '#9cb426'];

	return colors[_.random(0, colors.length - 1)];
};

var findPlayerById = function(id) {
  return _.find(players, function(p) {
    return p.id == id;
  });
};

app.get("/", function(request, response) {
	response.render('index.html');
});

io.sockets.on("connection", function(socket) {
	
	players.forEach(function(player) {
		socket.emit('player joined', player);
	});

	socket.on("player join", function(name) {
		var player = { id: socket.id ,name: name, x: 0, y: 0, color: randomColor() };

		players.push(player);
		io.sockets.emit('player joined', player);
	});

  socket.on("player moved", function(playerId, moverId, x, y) {
    var player = findPlayerById(playerId);
    var mover = findPlayerById(moverId);

    player.x = x;
    player.y = y;
    player.borderColor = mover.color;

    io.sockets.emit('player updated', player);
  });

	socket.on("disconnect", function() {
    var player = findPlayerById(socket.id);

		players = _.reject(players, function(p) {
			return p.id == player.id;
		});

		io.sockets.emit('player left', player);
	});
});



server.listen(process.env.PORT || 8383);
