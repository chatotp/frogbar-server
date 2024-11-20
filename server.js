const http = require('http');
const { Server } = require('socket.io');
const { generateContent } = require('./ai/gemini');

const { getAsteroids } = require('./db/setup');

// Setup
const port = 3000;

const httpServer = http.createServer((req, res) => {
    // health check endpoint
    if (req.method === "GET" && req.url === "/status") {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("OK");
    } else {
        // 404 for other routes
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
    }
});
// TODO: Change this in prod!
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173"
    }
})

// socketId : position, rotation, hp, maxHP
let players = {};

// predefined
const sunPosition = { x: 200, y: 0, z: 100 };
const sunRadius = 50;

io.on('connection', (socket) => {
    // Check if the number of players exceeds 20
    if (Object.keys(players).length >= 20) {
        socket.emit('unauthorized', 'Maximum player limit reached. Try again later.');
        socket.disconnect(); // Disconnect the new player
        return;
    }
    
    socket.on('setUserData', async (data) => {
        socket.emit('init', players);
        socket.emit('initAsteroids',  await getAsteroids());
        
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
            const prompt = `${username} is at position (${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)}) looking in direction (${rotation._x.toFixed(2)}, ${rotation._y.toFixed(2)}, ${rotation._z.toFixed(2)}). The sun is positioned at (${sunPosition.x}, ${sunPosition.y}, ${sunPosition.z}). Other players' positions are: ${JSON.stringify(players)}. They say: "${msg.slice(3).trim()}"`;
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
        if (playerId !== socket.id)
        {
            if (players[playerId].hp > 0)
                {
                    players[playerId].hp -= damage;
                    console.log(playerId);
                    io.emit("updateHealth", playerId, damage);
                }
        }
    });

    // bullet emit
    socket.on("emitBullet", (position, rotation, userColor) => {
        socket.broadcast.emit("emitBulletPlayer", socket.id, position, rotation, userColor);
    })
});

httpServer.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`)
})