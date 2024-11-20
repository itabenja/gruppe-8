import express from 'express';
import pg from 'pg';
import leaderboardRoutes from './leaderboard.js'; // Adjust the path if necessary

const server = express();

// Use the leaderboard routes
server.use('/api', leaderboardRoutes);

// Other server setup or routes can follow here

const router = express.Router();

const db = new pg.Pool({
    host: 'ep-dawn-cake-a2pb2gce.eu-central-1.aws.neon.tech',
    port: 5432,
    database: 'Projekt-renewable energy',
    user: 'Projekt-renewable energy_owner',
    password: 'mTBxARibh1t4',
    ssl: {
        rejectUnauthorized: false, // Allows SSL connection without strict certificate verification
    },
});

// Leaderboard API endpoint
router.get('/leaderboard', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT  
                country, 
                CASE
                    WHEN SUM(primary_energy.energy_consumption) = 0 THEN NULL
                    ELSE (SUM(renewable_energy.energy_consumption) * 100.0 / SUM(primary_energy.energy_consumption))
                END AS renewable_percentage
            FROM 
                renewable_energy
            JOIN 
                primary_energy USING (country, year)
            GROUP BY 
                country
            HAVING SUM(primary_energy.energy_consumption) > 0
            ORDER BY 
                renewable_percentage DESC;
        `);

        if (result.rows.length === 0) {
            console.warn('No leaderboard data available');
            return res.status(404).send({ error: "No leaderboard data available" });
        }

        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching leaderboard data:", error);
        res.status(500).send({ error: "Internal Server Error", details: error.message });
    }
});
