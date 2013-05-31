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
		console.log(name);
		socket.set('name', name);
		io.sockets.emit('player joined', { name: name, x: 0, y: 0 });
	});
});



server.listen(process.env.PORT || 8383);