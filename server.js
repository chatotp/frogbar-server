const fs = require('fs');
const https = require('https');
const { Server } = require('socket.io');

const port = 3000;
const options = {
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert')
}

const httpsServer = https.createServer(options);
// TODO: Change this in prod!
const io = new Server(httpsServer, {
    cors: {
        origin: "https://localhost:5173"
    }
})

// socketId : position
let players = {};

io.on('connection', (socket) => {

    socket.on('setUserData', (data) => {
        socket.emit('init', players);

        players[socket.id] = { 
            username: data.username || "Anonymous", 
            color: data.color || "white", 
            position: { x: 0, y: 0, z: 0 } 
        };
    });

    // listen for pos updates from client
    socket.on('updatePos', (data) => {
        if (players[socket.id] && data) {
            players[socket.id].position = { 
                x: data.position.x, 
                y: data.position.y, 
                z: data.position.z 
            };

            players[socket.id].rotation = {
                _x: data.rotation._x,
                _y: data.rotation._y,
                _z: data.rotation._z
            };
        };
        io.emit('updateAll', players);
    })

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('disconnectPlayer', socket.id);
    })

    // listen for chat updates
    socket.on("chatMsg", (msg) => {
        io.emit("chatMsg", { user: players[socket.id]?.username || "<NOUSERNAME>", color: players[socket.id]?.color, msg });
    })
})

httpsServer.listen(3000, () => {
    console.log(`Server is running on https://localhost:${port}`)
})