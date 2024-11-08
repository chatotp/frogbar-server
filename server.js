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

let players = {};

io.on('connection', (socket) => {
    console.log('A new player connected: ' + socket.id);

    // send curr pos of other players to new client
    socket.emit('init', players);

    // listen for pos updates from client
    socket.on('updatePos', (position) => {
        console.log('Player Pos Updated' + socket.id);
        players[socket.id] = position;
        io.emit('updateAll', players);
    })

    socket.on('disconnect', () => {
        console.log('Player disconnected: ' + socket.id);
        delete players[socket.id];
        io.emit('disconnectPlayer', socket.id);
    })
})

httpsServer.listen(3000, () => {
    console.log(`Server is running on https://localhost:${port}`)
})