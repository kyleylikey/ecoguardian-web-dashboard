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
  // ensure RiskReadings has gps columns
  db.get("PRAGMA table_info(RiskReadings)", (err, row) => {
    // intentionally query all column names
  });

  // Helper to add missing columns if necessary
  function ensureColumn(table, column, definition, cb) {
    db.all(`PRAGMA table_info(${table});`, (pErr, cols) => {
      if (pErr) return cb(pErr);
      const exists = (cols || []).some(c => c.name === column);
      if (exists) return cb(null, false);
      db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition};`, (aErr) => {
        if (aErr) return cb(aErr);
        return cb(null, true);
      });
    });
  }

  ensureColumn('RiskReadings', 'latitude', 'REAL', (e) => { if (e) console.warn(e); });
  ensureColumn('RiskReadings', 'longitude', 'REAL', (e) => { if (e) console.warn(e); });
  ensureColumn('RiskReadings', 'altitude', 'REAL', (e) => { if (e) console.warn(e); });
  ensureColumn('RiskReadings', 'fix', 'INTEGER DEFAULT 0', (e) => { if (e) console.warn(e); });

  // Copy GPS values from Readings into RiskReadings where possible
  db.run(`
    UPDATE RiskReadings
    SET latitude = (SELECT latitude FROM Readings WHERE Readings.sensorReadingID = RiskReadings.sensorReadingID),
        longitude = (SELECT longitude FROM Readings WHERE Readings.sensorReadingID = RiskReadings.sensorReadingID),
        altitude = (SELECT altitude FROM Readings WHERE Readings.sensorReadingID = RiskReadings.sensorReadingID),
        fix = COALESCE((SELECT fix FROM Readings WHERE Readings.sensorReadingID = RiskReadings.sensorReadingID), fix)
    WHERE sensorReadingID IS NOT NULL;
  `, (uErr) => { if (uErr) console.warn("Migration update RiskReadings GPS failed:", uErr.message); });
});

db.serialize(() => {
    // Create SensorNode table
    db.run(`
      CREATE TABLE IF NOT EXISTS SensorNode (
        nodeID INTEGER PRIMARY KEY,
        name TEXT DEFAULT NULL,
        status TEXT CHECK(status IN ('active','inactive')) NOT NULL,
        last_seen DATETIME
      )
    `);

    // Migration: ensure 'name' column exists for older DBs
    db.all(`PRAGMA table_info('SensorNode')`, (err, cols) => {
      if (!err && Array.isArray(cols)) {
        const hasName = cols.some(c => c.name === 'name');
        if (!hasName) {
          db.run(`ALTER TABLE SensorNode ADD COLUMN name TEXT DEFAULT NULL`, (alterErr) => {
            if (alterErr) console.warn("Failed to add 'name' column to SensorNode:", alterErr);
            else console.log("✅ Added 'name' column to SensorNode");
          });
        }
      }
    });
 
    // Create Readings table
    db.run(`
      CREATE TABLE IF NOT EXISTS Readings (
        sensorReadingID INTEGER PRIMARY KEY AUTOINCREMENT,
        nodeID INTEGER NOT NULL,
        timestamp DATETIME NOT NULL,
        temperature REAL,
        humidity REAL,
        co_level INTEGER,
        latitude REAL,
        longitude REAL,
        altitude REAL,
        fix INTEGER DEFAULT 0,
        FOREIGN KEY(nodeID) REFERENCES SensorNode(nodeID)
      )
    `);

    // Migration: add missing GPS columns to older DBs
    db.all(`PRAGMA table_info('Readings')`, (err, cols) => {
      if (!err && Array.isArray(cols)) {
        const colNames = cols.map(c => c.name);
        const adds = [];
        if (!colNames.includes('latitude')) adds.push(`ALTER TABLE Readings ADD COLUMN latitude REAL`);
        if (!colNames.includes('longitude')) adds.push(`ALTER TABLE Readings ADD COLUMN longitude REAL`);
        if (!colNames.includes('altitude')) adds.push(`ALTER TABLE Readings ADD COLUMN altitude REAL`);
        if (!colNames.includes('fix')) adds.push(`ALTER TABLE Readings ADD COLUMN fix INTEGER DEFAULT 0`);
        adds.forEach(sql => {
          db.run(sql, (aErr) => {
            if (aErr) console.warn('Failed to add column to Readings:', aErr.message);
            else console.log('✅ Added column to Readings:', sql);
          });
        });
      }
    });

     // Table for GPS readings (linked to the Readings entry)
    db.run(`
      CREATE TABLE IF NOT EXISTS GPSData (
        gpsID INTEGER PRIMARY KEY AUTOINCREMENT,
        readingID INTEGER NOT NULL,
        latitude REAL,
        longitude REAL,
        altitude REAL,
        fix BOOLEAN,
        FOREIGN KEY(readingID) REFERENCES Readings(sensorReadingID)
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
      FOREIGN KEY(nodeID) REFERENCES SensorNode(nodeID)
    )
  `);
});

module.exports = db;
