var express = require("express"),
    app = express(),
		server = require("http").createServer(app),
		io = require("socket.io").listen(server);

app.use(express.static(__dirname + "/public"));

app.get("/", function(request, response) {
	response.render('index.html');
});

io.sockets.on("connection", function(socket) {
	
	socket.on("player join", function(name) {
		var player = { name: name, x: 0, y: 0 };

		socket.set('player', player);
		io.sockets.emit('player joined', player);
	});

	socket.on("disconnect", function() {
		socket.get('player', function(err, player) {
			io.sockets.emit('player left', player);
		});
	});
});



server.listen(process.env.PORT || 8383);