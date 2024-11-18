/*import pg from 'pg';
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
const dbResult = await db.query('select now()');
console.log('Database connection established on', dbResult.rows[0].now);

console.log('Recreating tables...');
db.query(`
drop table if exists primary_energy;
drop table if exists renewable_energy;
drop table if exists solar_energy_requirements;
drop table if exists solar_energy_requirements_data;

create table primary_energy (
country text ,
year ,
energy_consumption
);

create table renewable_energy (
country text ,
year ,
energy_consumption
);

ceate table solar_energy_requirements (
country VARCHAR(50), 
solar_generation_twh NUMERIC, 
total_energy_gwh NUMERIC, 
current_solar_percentage NUMERIC, 
missing_coverage_percentage NUMERIC, 
required_solar_capacity_mw NUMERIC 
);

create table solar_energy_requirements_data (

);

`);
console.log('Tables recreated.');

console.log('Copying data from CSV files...');
copyIntoTable(db, `
	copy artists (artist_id, stage_name, nationality)
	from stdin
	with csv`, 'db/artists.csv');
copyIntoTable(db, `
	copy albums (album_id, title, artist_id, release_date, riaa_certificate)
	from stdin
	with csv header`, 'db/albums.csv');
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
} 
*/