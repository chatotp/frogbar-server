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

    // send curr pos of other players to new client
    socket.emit('init', players);

    // listen for pos updates from client
    socket.on('updatePos', (position) => {
        players[socket.id] = position;
        io.emit('updateAll', players);
    })

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('disconnectPlayer', socket.id);
    })

    // listen for chat updates
    socket.on("chatMsg", (msg) => {
        io.emit("chatMsg", { user: socket.id, msg });
    })
})

httpsServer.listen(3000, () => {
    console.log(`Server is running on https://localhost:${port}`)
})