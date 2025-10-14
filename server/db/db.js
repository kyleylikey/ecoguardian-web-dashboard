const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'eco.db'), (err) => {
    if (err) {
        console.error("❌ Failed to connect:", err);
    } else {
        console.log("✅ Connected to SQLite eco.db");
    }
});

db.serialize(() => {
    // Create SensorNode table
    db.run(`
      CREATE TABLE IF NOT EXISTS SensorNode (
        nodeID INTEGER PRIMARY KEY,
        status TEXT CHECK(status IN ('active','inactive')) NOT NULL,
        last_seen DATETIME
      )
    `);

    // Create Readings table
    db.run(`
      CREATE TABLE IF NOT EXISTS Readings (
        sensorReadingID INTEGER PRIMARY KEY AUTOINCREMENT,
        nodeID INTEGER NOT NULL,
        timestamp DATETIME NOT NULL,
        temperature REAL,
        humidity REAL,
        co_level INTEGER,
        battery_level TINYINT,
        FOREIGN KEY(nodeID) REFERENCES SensorNode(nodeID)
      )
    `);

     // Create RiskDetection table
    db.run(`
      CREATE TABLE IF NOT EXISTS RiskDetection (
        riskID INTEGER PRIMARY KEY AUTOINCREMENT,
        nodeID INTEGER NOT NULL,
        readingID INTEGER, -- optional, links to Readings if applicable
        risk_type TEXT CHECK(risk_type IN ('fire','chainsaw','gunshots','poaching')),
        risk_level TEXT CHECK(risk_level IN ('low','medium','high')) DEFAULT NULL, -- used only for fire
        confidence REAL DEFAULT NULL, -- used only for audio detections
        timestamp DATETIME NOT NULL,
        resolved BOOLEAN DEFAULT 0,
        FOREIGN KEY(nodeID) REFERENCES SensorNode(nodeID),
      )
    `);
});

module.exports = db;
