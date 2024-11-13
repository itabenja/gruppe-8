import express from 'express';
import pg from 'pg';

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
    const dbResult = await db.query('select * from solar_energy_requirements');
    response.send(dbResult.rows);
};

