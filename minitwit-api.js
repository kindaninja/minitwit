// Express web framework https://expressjs.com/
const express = require('express');
const app = express();
// Sessions https://github.com/expressjs/session#readme
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bodyParser = require('body-parser');

app.use(bodyParser.json());

// SQLite3 https://github.com/mapbox/node-sqlite3
const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('/tmp/minitwit.db', (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('Connected to the minitwit.db SQlite database.');
});

// Register handler
app.post('/register', async function(req, res) {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.pwd;
    console.log(username, email, password);
    let error;
    if(!username) {
        error = 'You have to enter a username';
    } else if (!email || !email.includes('@')) {
        error = 'You have to enter a valid email address';
    } else if (!password) {
        error = 'You have to enter a password';
    } else if (await selectOne('SELECT 1 FROM user WHERE username = ?',[username])) {
        error = 'The username is already taken';
    } else {
        await insertOne(
            'INSERT INTO user(username, email, pw_hash) VALUES(?, ?, ?)',
            [username, email, password.lameHash()]);
        return res.status(204).send();

    }
    return res.json({"status": 400, "error_msg": error}).status(400).send();
});

// Start application
app.listen(5001);
console.log('MiniTwit API is running on port 5001..');

//// Database helper functions
// Select only 1 row
function selectOne(query, params) {
    return new Promise((resolve, reject) => {
        db.get(query, params, (err, row) => {
            if (err) {
                console.error(err.message);
                reject();
            }
            resolve(row);
        });
    });
}

// Select multiple rows
function selectAll(query, params) {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) {
                console.error(err.message);
                reject();
            }
            resolve(rows);
        });
    });
}
// Insert 1 row
function insertOne(query, params) {
    return new Promise((resolve, reject) => {
        db.run(query, params, function(err) {
            if (err) {
                console.error(err.message);
                reject();
            }
            // Return the last inserted id
            resolve(this.lastID)
        });
    });
}

// Lame password hash function
// TODO Use proper hashing library, bcrypt maybe?
String.prototype.lameHash = function() {
    var hash = 0;
    if (this.length == 0) {
        return hash;
    }
    for (var i = 0; i < this.length; i++) {
        var char = this.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return 'lame' + hash + 'hash';
}
