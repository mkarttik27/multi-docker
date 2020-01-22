const keys = require('./keys');

// Express App Setup
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Postgres Client Setup
const { Pool } = require('pg');
const pgClient = new Pool({
  user: keys.pgUser,
  host: keys.pgHost,
  database: keys.pgDatabase,
  password: keys.pgPassword,
  port: keys.pgPort
});
pgClient.on('error', () => console.log('Lost PG connection'));

pgClient
  .query('CREATE TABLE IF NOT EXISTS values (number INT)')
  .catch(err => console.log(err));

// Redis Client Setup
const redis = require('redis');
const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000
});
const redisPublisher = redisClient.duplicate();

// Express route handlers

app.get('/', (req, res) => {
  res.send('Hi');
});

app.get('/values/all', async (req, res) => {
  console.log('Recieved request for all values from DB');
  const values = await pgClient.query('SELECT * from values');
  console.log('Recieved response from postgres with ' + values.rows);

  res.send(values.rows);
});

app.get('/values/current', async (req, res) => {
  console.log('Recieved request for current values from redis');
  redisClient.hgetall('values', (err, values) => {
    console.log('Recieved response from redis');
    res.send(values);
  });

});

app.post('/values', async (req, res) => {
  const index = req.body.index;
  console.log('Recieved request for finding fibonaccii number of ' + index);


  if (parseInt(index) > 40) {
    return res.status(422).send('Index too high');
  }

  redisClient.hset('values', index, 'Nothing yet!');
  console.log('Set the key '+ index + ' in redis');
  redisPublisher.publish('insert', index);
  pgClient.query('INSERT INTO values(number) VALUES($1)', [index]);
  console.log('Set in database the value ' + index);

  res.send({ working: true });
});

app.listen(5000, err => {
  console.log('Listening');
});
