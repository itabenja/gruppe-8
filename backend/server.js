import express from 'express';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

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

const port = process.env.PORT || 3000;
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

// Async function for /api/TY
async function onGetTY(request, response) {
    try {
        const dbResult = await db.query(`
            SELECT 
                year,
                'primary' AS energy_type,
                SUM(energy_consumption) AS total_energy_consumption,
                100.0 AS renewable_percentage
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
                )) * 100 AS renewable_percentage
            FROM 
                renewable_energy
            WHERE 
                country = 'Total World'
            GROUP BY 
                year
            ORDER BY 
                year;
        `);
        response.json(dbResult.rows);
    } catch (err) {
        console.error('Error fetching data from database', err);
        response.status(500).send('Internal Server Error');
    }
}

// Async function for /api/energy-data/:country
async function onGetEnergyData(req, res) {
    const countryName = req.params.country;

    try {
        const dbResult = await db.query(`
            SELECT 
                primary_energy.year,
                'primary' AS energy_type,
                SUM(primary_energy.energy_consumption) AS total_energy_consumption,
                100.0 AS renewable_percentage
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
                )) * 100 AS renewable_percentage
            FROM 
                renewable_energy
            WHERE 
                renewable_energy.country = $1
            GROUP BY 
                renewable_energy.year
            ORDER BY 
                year;
        `, [countryName]);

        res.json(dbResult.rows);
    } catch (err) {
        console.error('Error fetching data from database:', err.message);
        res.status(500).send('Internal Server Error');
    }
}

// Async function for /api/countries/:countryName
async function onGetCountryData(req, res) {
    const countryName = req.params.countryName;
    console.log("API request for country:", countryName);

    try {
        const result = await db.query(
            `SELECT 
                country,
                current_solar_coverage, 
                missing_solar_coverage, 
                required_additional_solar_capacity, 
                panels_needed, 
                estimated_cost, 
                co2_reduction, 
                land_usage 
            FROM solar_energy_requirements_data 
            WHERE LOWER(country) = LOWER($1)`,
            [countryName]
        );

        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            console.log("No data found for:", countryName);
            res.status(404).send({ error: "Country data not found" });
        }
    } catch (error) {
        console.error("Error fetching country data:", error);
        res.status(500).send({ error: "Internal Server Error" });
    }
}

// Async function for /api/leaderboard
// Async function for /api/leaderboard
async function onGetLeaderboard(req, res) {
    try {
        const result = await db.query(`
            SELECT  
                country, 
                (SUM(renewable_energy.energy_consumption) * 100.0 / NULLIF(SUM(primary_energy.energy_consumption), 0)) AS renewable_percentage
            FROM 
                renewable_energy
            JOIN 
                primary_energy USING (country, year)
            GROUP BY 
                country
            ORDER BY 
                renewable_percentage DESC;
        `);
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching leaderboard data:", error);
        res.status(500).send({ error: "Internal Server Error" });
    }
}

