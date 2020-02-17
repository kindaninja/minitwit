// Express web framework https://expressjs.com/
const express = require('express');
const app = express();
// Sessions https://github.com/expressjs/session#readme
var cookieParser = require('cookie-parser');
var session = require('express-session');

// SQLite3 https://github.com/mapbox/node-sqlite3
const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('/tmp/minitwit.db', (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('Connected to the minitwit.db SQlite database.');
});



// Start application
app.listen(5001);
console.log('MiniTwit API is running on port 5001..');