import express from 'express';
import pg from 'pg';
import dotenv from 'dotenv';
import leaderboardRoutes from './leaderboard.js'; // Ensure this path is correct

dotenv.config();

console.log('Connecting to the database...');
const db = new pg.Pool({
    host: process.env.PG_HOST,
    port: parseInt(process.env.PG_PORT),
    database: process.env.PG_DATABASE,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    ssl: process.env.PG_REQUIRE_SSL ? {
        rejectUnauthorized: false,
    } : undefined,
});

try {
    const dbResult = await db.query('select now() as now');
    console.log('Database connection established on', dbResult.rows[0].now);
} catch (err) {
    console.error('Database connection error', err);
}

const port = process.env.PORT || 3000;
const server = express();

// Serve static frontend files
server.use(express.static('frontend'));

// Middleware to log each request
server.use((req, res, next) => {
    console.log(new Date(), req.method, req.url);
    next();
});

// Add leaderboard routes
server.use('/api', leaderboardRoutes);

server.get('/api/TY', async (req, res) => {
    try {
        const dbResult = await db.query(`
            SELECT 
    COALESCE(p.year, r.year) AS year,
    COALESCE(SUM(p.energy_consumption), 0) AS primary_energy,
    COALESCE(SUM(r.energy_consumption), 0) AS renewable_energy,
    COALESCE(SUM(p.energy_consumption), 0) - COALESCE(SUM(r.energy_consumption), 0) AS non_renewable_primary
FROM 
    primary_energy p
FULL OUTER JOIN 
    renewable_energy r
ON 
    p.year = r.year AND p.country = r.country
WHERE 
    COALESCE(p.country, r.country) = 'Total World'
GROUP BY 
    COALESCE(p.year, r.year)
ORDER BY 
    year;

        `);

        // Transform the result to directly match the frontend's expectations
        const transformedData = dbResult.rows.map(row => ({
            year: row.year,
            primary: row.primary_energy,
            renewable: row.renewable_energy,
            nonRenewablePrimary: row.non_renewable_primary
        }));

        res.json(transformedData);
    } catch (err) {
        console.error('Error fetching data from the database:', err);
        res.status(500).send('Internal Server Error');
    }
});


// Endpoint to fetch energy data for a specific country
server.get('/api/energy-data/:country', async (req, res) => {
    const countryName = req.params.country;

    try {
        const dbResult = await db.query(`
            select year, SUM(total_energy)-SUM(renewable_energy) as non_renewable_energy, SUM(renewable_energy) as renewable_energy
            from (SELECT 
                primary_energy.year,
                SUM(primary_energy.energy_consumption) AS total_energy,
                0 AS renewable_energy
            FROM 
                primary_energy
            WHERE 
                primary_energy.country = $1
            GROUP BY 
                primary_energy.year
            
            UNION ALL
            
            SELECT 
                renewable_energy.year,
                0 AS total_energy,
                SUM(renewable_energy.energy_consumption)
                    
            FROM 
                renewable_energy
            WHERE 
                renewable_energy.country = $1
            GROUP BY 
                renewable_energy.year)
            GROUP BY
                year
            ORDER BY 
                year;
        `, [countryName]);

        res.send(dbResult.rows);
        
    } catch (err) {
        console.error('Error fetching data from database:', err.message);
        res.status(500).send('Internal Server Error');
    }
});

// Endpoint to fetch specific country data
server.get('/api/countries/:countryName', async (req, res) => {
    const countryName = req.params.countryName;
    console.log("API request for country:", countryName);

    try {
        // Log parametre før forespørgslen
        console.log('Executing query with country:', countryName);

        const result = await db.query(
            `SELECT 
                country,
                solar_generation_twh,
                solar_installed_capacity_mw,
                solar_panels_needed,
                area_needed_m2,
                total_area_km2
            FROM solar_panel_problem_solving_data 
            WHERE LOWER(country) = LOWER($1)`,
            [countryName]
        );

        // Log hele resultatet
        console.log('Query result:', result.rows);

        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            console.log("No data found for:", countryName);
            res.status(404).send({ error: "Country data not found" });
        }

    } catch (error) {
        console.error("Error fetching country data:", error);
        res.status(500).send({ error: "Failed to fetch country data" });
    }
});

server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
