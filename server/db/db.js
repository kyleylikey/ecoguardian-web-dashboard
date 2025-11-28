const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'eco.db'), (err) => {
    if (err) {
        console.error("❌ Failed to connect:", err);
    } else {
        console.log("✅ Connected to SQLite eco.db");
    }
});

// run simple migrations on startup
db.serialize(() => {
  //create sensornodes table
  db.run(`
    CREATE TABLE IF NOT EXISTS SensorNodes (
      nodeID INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT CHECK(status IN ('active','inactive')) NOT NULL,
      last_seen DATETIME
    )
  `);

  //create readings table
  db.run(`
    CREATE TABLE IF NOT EXISTS Readings (
      readingID INTEGER PRIMARY KEY AUTOINCREMENT,
      nodeID INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      temperature REAL,
      humidity REAL,
      co_level INTEGER,
      FOREIGN KEY (nodeID) REFERENCES SensorNodes(nodeID)
    )
  `);

  //create risks table 
  db.run(`
    CREATE TABLE IF NOT EXISTS Risks (
      riskID INTEGER PRIMARY KEY AUTOINCREMENT,
      nodeID INTEGER NOT NULL,
      readingID INTEGER,
      timestamp DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      risk_type TEXT CHECK(risk_type IN ('fire','chainsaw','gunshots')) NOT NULL,
      fire_risklvl TEXT CHECK(fire_risklvl IN ('low','medium','high')),
      confidence REAL DEFAULT NULL,
      cooldown_counter INTEGER DEFAULT 0,
      resolved_at DATETIME DEFAULT NULL,
      is_incident_start BOOLEAN DEFAULT 0,
      FOREIGN KEY (nodeID) REFERENCES SensorNodes(nodeID),
      FOREIGN KEY (readingID) REFERENCES Readings(readingID)
    )
  `);

  //create gpsdata table
  db.run(`
    CREATE TABLE IF NOT EXISTS GPSData (
      gpsID INTEGER PRIMARY KEY AUTOINCREMENT,
      readingID INTEGER,
      riskID INTEGER,
      latitude REAL,
      longitude REAL,
      altitude REAL,
      fix BOOLEAN,
      FOREIGN KEY (readingID) REFERENCES Readings(readingID),
      FOREIGN KEY (riskID) REFERENCES Risks(riskID)
    )
  `);
});

module.exports = db;
