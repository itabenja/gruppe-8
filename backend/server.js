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
server.get('/api/opgave1', onGetOpgave1);
server.get('/api/opgave2a', onGetOpgave2a);
server.get('/api/opgave3', onGetOpgave3);
server.get('/api/TY', onGetTY);
server.get('/api/onGetAllAlbums', onGetAllAlbums);
server.get('/api/YearReleased', onGetYearReleased);
server.get('/api/1980', onGet1980);
server.listen(port, onServerReady);

function onGetOpgave1(request, response)  {
    response.send({ da: 'Copenhagen', se: 'Stockholm', no: 'Oslo' });
}
function onGetOpgave2a(request, response)  {
    response.send({'2a':2348});
}
    
function onGetOpgave3(request, response) {
    const query = request. query;
    const a = parseInt(query.a);
    const b = parseInt(query.b);
    response.send({'a':a,'b':b,'sum':a + b });
    ;
}
 
function onEachRequest(request, response, next) {
    console.log(new Date(), request.method, request.url);
    next();
}
function onServerReady() {
    console.log('Webserver running on port', port);
} 
async function onGetAllAlbums(request, response) {
    const dbResult = await db.query('select * from albums');
    response.send(dbResult.rows);
}
async function onGetTY(request, response) {
    const dbResult = await db.query('select * from solar_energy_requirements');
    response.send(dbResult.rows);
}
async function onGetYearReleased(request, response) {
    const dbResult = await db.query('select year as released, title, artist from albums');
    response.send(dbResult.rows);
}
async function onGet1980(request, response) {
    const year = request.query.year || 1980;
    const dbResult = await db.query('select * from albums where year <'+year);
    response.send(dbResult.rows);
};
