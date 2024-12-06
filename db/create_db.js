import pg from 'pg';
import dotenv from 'dotenv';
import { pipeline } from 'node:stream/promises'
import fs from 'node:fs'
import { from as copyFrom } from 'pg-copy-streams'

dotenv.config();
console.log('Connecting to database', process.env.PG_DATABASE);
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

export default db; 

const dbResult = await db.query('select now()');
console.log('Database connection established on', dbResult.rows[0].now);

console.log('Recreating tables...');
await db.query(`
drop table if exists primary_energy;
drop table if exists renewable_energy;
drop table if exists Solar_Panel_Coverage;




-- Table for primary energy
CREATE TABLE primary_energy (
    country VARCHAR(255) NOT NULL,
    year VARCHAR(4) NOT NULL,
    energy_consumption NUMERIC NOT NULL,
    PRIMARY KEY (country, year) -- Composite primary key to ensure uniqueness
);

-- Table for renewable energy
CREATE TABLE renewable_energy (
    country VARCHAR(255) NOT NULL,
    year VARCHAR(4) NOT NULL,
    energy_consumption NUMERIC NOT NULL,
    PRIMARY KEY (country, year), -- Composite primary key
    FOREIGN KEY (country, year) REFERENCES primary_energy (country, year) -- Foreign key to enforce valid references
);

-- Table for solar panel coverage
CREATE TABLE Solar_Panel_Coverage (
    country VARCHAR(255) NOT NULL,
    electricity_consumption_twh FLOAT NOT NULL,
    electricity_consumption_kwh FLOAT NOT NULL,
    solar_panels_needed FLOAT NOT NULL,
    area_needed_m2 FLOAT NOT NULL,
    area_needed_km2 FLOAT NOT NULL,
    PRIMARY KEY (country) -- Assume one row per country
);

-- Optional: Adding indexes for better performance
CREATE INDEX idx_primary_energy_country_year ON primary_energy (country, year);
CREATE INDEX idx_renewable_energy_country_year ON renewable_energy (country, year);
CREATE INDEX idx_solar_panel_coverage_country ON Solar_Panel_Coverage (country);

`);
console.log('Tables recreated.');

        console.log('Copying data from CSV files...');
        await copyIntoTable(db, `
            copy primary_energy (country, year, energy_consumption)
            from stdin
            with csv header`, 'db/primary_energy_final_all_correct-1.csv');
        await copyIntoTable(db, `
            copy renewable_energy (country, year, energy_consumption)
            from stdin
            with csv header`, 'db/renewable_energy_final_all_correct.csv');

        await copyIntoTable(db, `
            copy Solar_Panel_Coverage (country,electricity_consumption_twh,electricity_consumption_kwh,solar_panels_needed,area_needed_m2,area_needed_km2)
            from stdin
            with csv header`, 'db/Solar_Panel_Problem_Solving_Data.csv');

await db.end();
console.log('Data copied.');

async function copyIntoTable(db, sql, file) {
	const client = await db.connect();
	try {
		const ingestStream = client.query(copyFrom(sql))
		const sourceStream = fs.createReadStream(file);
		await pipeline(sourceStream, ingestStream);
	} finally {
		client.release();
	}
};
