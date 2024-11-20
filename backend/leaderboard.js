import express from 'express';
import pg from 'pg';

const router = express.Router();

const db = new pg.Pool({
    host: 'ep-dawn-cake-a2pb2gce.eu-central-1.aws.neon.tech',
    port: 5432,
    database: 'Projekt-renewable energy',
    user:     'Projekt-renewable energy_owner',
    password: 'mTBxARibh1t4',
    ssl: {
        rejectUnauthorized: false // Allows SSL connection without strict certificate verification
    }
});
console.log('Connecting to the database...');

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
        console.error("Error fetching leaderboard data:", error);
        res.status(500).send({ error: "Internal Server Error" });
    }
});

export default router;
