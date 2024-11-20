import express from 'express';
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

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
console.log('Database connection established.');
console.log('PG_PASSWORD:', process.env.PG_PASSWORD);

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
            GROUP BY 
                country
            ORDER BY 
                renewable_percentage DESC;
        `);
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching leaderboard data:", error.message, error.stack);
        res.status(500).send({ error: "Failed to fetch leaderboard data. Please try again later." });
    }
});

export default router;
