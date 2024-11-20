const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./db/asteroids.db');

function createAsteroidTable() {
    console.log("Creating asteroid table in db...");
    db.run(`
        CREATE TABLE IF NOT EXISTS asteroids (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            position_x REAL,
            position_y REAL,
            position_z REAL,
            velocity_x REAL,
            velocity_y REAL,
            velocity_z REAL,
            radius REAL,
            last_updated INTEGER
        )
    `, (err) => {
        if (err) {
            console.error("Error creating table:", err);
        } else {
            console.log("Table created or already exists.");
        }
    });
}

function insertAsteroid(numAsteroids) {
    const timestamp = Date.now();

    // batch insert
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        for (let i = 0; i < numAsteroids; i++) {
            // Randomize the distance from the sun (either near or far)
            const distanceFromSun = Math.random() > 0.5 ? 250 : 1000; // 50% chance for near or far

            // Randomize position around the sun
            const angle = Math.random() * Math.PI * 2;
            const position_x = 200 + distanceFromSun * Math.cos(angle);
            const position_y = 0 + Math.random() * 500 - 250;  // Variance in Y
            const position_z = 100 + distanceFromSun * Math.sin(angle);

            // Randomize velocity (either fast or slow)
            const velocity_x = Math.random() > 0.5 ? 0.01 : 0;
            const velocity_y = Math.random() > 0.5 ? 0.1 : 0.01;
            const velocity_z = Math.random() > 0.5 ? 0.01 : 0;

            // Randomize the radius of the asteroid
            const radius = Math.random() * 20 + 10;  // Random radius between 10 and 30 units

            // Insert asteroid data into the database
            db.run(`
                INSERT INTO asteroids (position_x, position_y, position_z, velocity_x, velocity_y, velocity_z, radius, last_updated)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [position_x, position_y, position_z, velocity_x, velocity_y, velocity_z, radius, timestamp]);
        }

        db.run("COMMIT", (err) => {
            if (err) {
                console.error("Error committing transaction:", err);
            } else {
                console.log(`${numAsteroids} asteroids inserted into the database with random radius.`);
            }
        });
    });
}

function getAsteroids() {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM asteroids", (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

// Update the asteroid's position based on the velocity and elapsed time
function updateAsteroidsPositions() {
    const currentTime = Date.now();

    db.all("SELECT * FROM asteroids", (err, asteroids) => {
        if (err) {
            console.error("Error fetching asteroids:", err);
            return;
        }

        asteroids.forEach((asteroid) => {
            const timeElapsed = (currentTime - asteroid.last_updated) / 1000;  // Time in seconds
            const newPosX = asteroid.position_x + asteroid.velocity_x * timeElapsed;
            const newPosY = asteroid.position_y + asteroid.velocity_y * timeElapsed;
            const newPosZ = asteroid.position_z + asteroid.velocity_z * timeElapsed;

            // Update asteroid position in database
            db.run(`
                UPDATE asteroids
                SET position_x = ?, position_y = ?, position_z = ?, last_updated = ?
                WHERE id = ?
            `, [newPosX, newPosY, newPosZ, currentTime, asteroid.id], (err) => {
                if (err) {
                    console.error("Error updating asteroid:", err);
                }
            });
        });
    });
}

// Initialize the asteroid table and insert 15 random asteroids
createAsteroidTable();
insertAsteroid(15);

// Set up periodic updates for asteroid positions in DB every 100ms
setInterval(async () => {
    await updateAsteroidsPositions();
}, 100);

module.exports = { getAsteroids };
