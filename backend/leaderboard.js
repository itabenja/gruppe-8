import express from 'express';
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

console.log('Connecting to the database...');
const db = new pg.Pool({
    host: process.env.PG_HOST,
    port: parseInt(process.env.PG_PORT, 10),
    database: process.env.PG_DATABASE,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    ssl: process.env.PG_REQUIRE_SSL ? { rejectUnauthorized: false } : undefined,
});

// Handle database errors gracefully
db.on('error', (err) => {
    console.error('Unexpected database pool error:', err);
});

// Leaderboard API endpoint
router.get('/leaderboard', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT  
    country, 
    (SUM(renewable_energy.energy_consumption) * 100.0 / NULLIF(SUM(primary_energy.energy_consumption), 0)) AS renewable_percentage
FROM 
    renewable_energy
JOIN 
    primary_energy USING (country, year)
WHERE 
    year = '2023' AND 
    country NOT IN (
        'USSR', 'Other South America', 'Other CIS', 'Eastern Africa', 
        'Total S&Cent. America', 'Middle Africa', 'Central America', 
        'Other Europe', 'Other Asia Pacific', 'Other Southern Africa', 
        'Total Europe', 'Of which: OECD', 'Total World', 'Non OECD', 
        'Total North America', 'Total Asia Pacific', 'Other Caribbean', 
        'Other Middle East', 'Total S. & Cent. America', 'of which: OECD', 'Non-OECD', 'Other Northern Africa', 'China Hong Kong SAR',
        'China Hong Kong SAR', 'Total', 'Total CIS', 'Total Middle East', 'European Union #'
    )
GROUP BY 
    country
ORDER BY 
    renewable_percentage DESC;

        `);

        // If no data is available, respond with 404
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No leaderboard data available.' });
        }

        // Send leaderboard data as JSON
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching leaderboard data:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard data. Please try again later.' });
    }
});

export default router;
