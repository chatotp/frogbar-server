const fs = require('fs');
const https = require('https');
const { Server } = require('socket.io');

const { generateContent } = require('./ai/gemini');

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
            position: { x: 0, y: 0, z: 0 },
            hp: data.hp,
            maxHP: data.maxHP
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

            players[socket.id].hp = data.hp;
            players[socket.id].maxHP = data.maxHP;
        };
        io.emit('updateAll', players);
    })
    
    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('disconnectPlayer', socket.id);
    })
    
    // listen for chat updates
    socket.on("chatMsg", async (msg) => {
        const username = players[socket.id]?.username || "<NOUSERNAME>";
        const color = players[socket.id]?.color;
        const position = players[socket.id]?.position;
        const rotation = players[socket.id]?.rotation;

        // Broadcast regular messages
        io.emit("chatMsg", { user: username, color, msg });
        
        // Check if the message starts with "/ai"
        if (msg.startsWith("/ai")) {
            const prompt = `${username} is at position (${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)}) looking in direction (${rotation._x.toFixed(2)}, ${rotation._y.toFixed(2)}, ${rotation._z.toFixed(2)}). They say: "${msg.slice(3).trim()}"`;            
            // Ensure a valid prompt exists
            if (prompt.length === 0) {
                io.emit("chatMsg", { user: "System", color: "red", msg: "Please provide a prompt after /ai." });
                return;
            }
            
            try {
                // Call the generateContent function
                const output = await generateContent(prompt);
                io.emit("chatMsg", { user: "Narrator", color: "yellow", msg: output });
            } catch (error) {
                console.error("Error generating AI response:", error);
                io.emit("chatMsg", { user: "System", color: "red", msg: "An error occurred while generating the AI response." });
            }
        }
    });

    // player hit by bullet
    socket.on("playerHit", (playerId, damage) => {
        if (players[playerId].hp > 0)
        {
            players[playerId].hp -= damage;
            io.emit("updateHealth", playerId, damage);
        }
    });
});

httpsServer.listen(port, () => {
    console.log(`Server is running on https://localhost:${port}`)
})