import express from 'express';
import pg from 'pg';
import dotenv from 'dotenv';

console.log('Connecting to the database...');
const db = new pg.Pool({ 
    host:     'ep-dawn-cake-a2pb2gce.eu-central-1.aws.neon.tech',
    port:     5432,
    database: 'Projekt-renewable energy',
    user:     'Projekt-renewable energy_owner',
    password: 'mTBxARibh1t4',
    ssl: {
        rejectUnauthorized: false // Allows SSL connection without strict certificate verification
    }
});

try {
    const dbResult = await db.query('select now() as now');
    console.log('Database connection established on', dbResult.rows[0].now);
} catch (err) {
    console.error('Database connection error', err);
}

const port = 3000;
const server = express();

server.use(express.static('frontend'));
server.use(onEachRequest);

// API end-point  TY
server.get('/api/TY', onGetTY); 


server.listen(port, onServerReady);

 
function onEachRequest(request, response, next) {
    console.log(new Date(), request.method, request.url);
    next();
} 

function onServerReady() {
    console.log('Webserver running on port', port);
} 

// async function til database TY
async function onGetTY(request, response) {
    try {
        const dbResult = await db.query(`
  SELECT 
    year,
    'primary' AS energy_type,
    SUM(energy_consumption) AS total_energy_consumption,
    100.0 AS renewable_percentage -- 100% for primary to reflect full primary energy
FROM 
    primary_energy
WHERE 
    country = 'Total World'
GROUP BY 
    year

UNION ALL

SELECT 
    year,
    'renewable' AS energy_type,
    SUM(energy_consumption) AS total_energy_consumption,
    (SUM(energy_consumption) / (
        SELECT SUM(energy_consumption)
        FROM primary_energy
        WHERE country = 'Total World' AND primary_energy.year = renewable_energy.year
    )) * 100 AS renewable_percentage -- Calculate the renewable percentage of primary energy
FROM 
    renewable_energy
WHERE 
    country = 'Total World'
GROUP BY 
    year
ORDER BY 
    year;



        `);
        response.json(dbResult.rows); // Send the data to the frontend
    } catch (err) {
        console.error('Error fetching data from database', err);
        response.status(500).send('Internal Server Error');
    }
};



// Define the endpoint to retrieve energy data dynamically by country
server.get('/api/energy-data/:country', async (req, res) => {
    const country = req.params.country;

    try {
        const dbResult = await db.query(`
            SELECT 
                primary_energy.year,
                'primary' AS energy_type,
                SUM(primary_energy.energy_consumption) AS total_energy_consumption,
                100.0 AS renewable_percentage -- 100% for primary to reflect full primary energy
            FROM 
                primary_energy
            WHERE 
                primary_energy.country = $1
            GROUP BY 
                primary_energy.year
            
            UNION ALL
            
            SELECT 
                renewable_energy.year,
                'renewable' AS energy_type,
                SUM(renewable_energy.energy_consumption) AS total_energy_consumption,
                (SUM(renewable_energy.energy_consumption) / (
                    SELECT SUM(primary_energy.energy_consumption)
                    FROM primary_energy
                    WHERE primary_energy.country = $1 AND primary_energy.year = renewable_energy.year
                )) * 100 AS renewable_percentage -- Calculate the renewable percentage of primary energy
            FROM 
                renewable_energy
            WHERE 
                renewable_energy.country = $1
            GROUP BY 
                renewable_energy.year
            ORDER BY 
                year;
        `, [country]); // Pass the country parameter here

        res.json(dbResult.rows); // Send the fetched data as JSON to the client
    } catch (err) {
        console.error('Error fetching data from database:', err.message);
        res.status(500).send('Internal Server Error');
    }
});
