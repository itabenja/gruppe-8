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
drop table if exists solar_energy_requirements;
drop table if exists solar_energy_requirements_data;

create table primary_energy (
country text,
year text,
energy_consumption numeric
);

create table renewable_energy (
country text ,
year text,
energy_consumption numeric
);

CREATE TABLE solar_energy_requirements (
    country VARCHAR(50), 
    solar_generation_twh NUMERIC, 
    total_energy_gwh NUMERIC, 
    current_solar_percentage NUMERIC, 
    missing_coverage_percentage NUMERIC, 
    required_solar_capacity_mw NUMERIC
);

create table solar_energy_requirements_data (
country VARCHAR(50) UNIQUE NOT NULL,
current_solar_coverage NUMERIC(5, 2),
missing_solar_coverage NUMERIC(5, 2),
required_additional_solar_capacity  NUMERIC ,
total_energy_consumption  NUMERIC,
panels_needed NUMERIC(20, 2),
estimated_cost NUMERIC,
co2_reduction NUMERIC(20, 2),
land_usage NUMERIC(20, 2)
);

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
    copy solar_energy_requirements (country, solar_generation_twh, total_energy_gwh, current_solar_percentage, missing_coverage_percentage, required_solar_capacity_mw)
    from stdin
    with csv header`, 'db/solar_energy_requirements.csv');

await copyIntoTable(db, `
    copy solar_energy_requirements_data (country, current_solar_coverage, missing_solar_coverage, required_additional_solar_capacity, total_energy_consumption, panels_needed, estimated_cost, co2_reduction, land_usage)
    from stdin
    with csv header`, 'db/solar_energy_requirements_data.csv');
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
