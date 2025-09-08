const express = require('express');
const cors = require('cors');

const app = express();

// Initialize DB 
require('./db/db');

// Middleware
app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
    res.json({ ok: true, service: 'Ecoguardian API', version: '0.1.0' });
});

//Routes
//readings
const readingsRoutes = require('./routes/readings');
app.use("/api/readings", readingsRoutes);




const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`EcoGuardian API up on http://localhost:${port}`);
});
