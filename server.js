const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// TODO: Change this on production server!
const allowedOrigins = ['http://localhost:5173']
app.use(cors({
    origin: (origin, callback) => {
        if (allowedOrigins.includes(origin))
        {
            callback(null, true);
        }
        else
        {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

let players = {};

// Redundant
app.use(express.static('public'));

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

const port = 3000;
server.listen(port, () => {
    // TODO: Change this!
    console.log(`Server is running on http://localhost:${port}`)
})