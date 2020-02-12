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

// Constants
const PER_PAGE = 20;
const SECRET = 'shhhhhhhhhh';

// EJS template engine https://ejs.co/
app.set('view engine', 'ejs');
// Static files
app.use(express.static('static'));
// Form data
app.use(express.urlencoded())
// Sessions
app.use(cookieParser());
app.use(session({secret: SECRET}));

//// Endpoints

// Home (User feed or redirect to public timeline)
app.get('/', async function(req, res) {
    if(!req.session.user_id) {
        return res.redirect('/public')
    }
    let messages = await selectAll(
        `SELECT message.*, user.* FROM message, user
                WHERE message.author_id = user.user_id AND (
                    user.user_id = ? OR
                    user.user_id IN (
                        SELECT whom_id FROM follower
                        WHERE who_id = ?))
                ORDER BY message.pub_date DESC LIMIT ?`,
        [req.session.user_id, req.session.user_id, PER_PAGE]
    );
    res.render('pages/timeline', {
        session_username: req.session.username,
        session_user_id: req.session.user_id,
        messages: messages,
        myFeed: true
    });
});

// Public timeline page
app.get('/public', async function(req, res) {
    let messages = await selectAll(
        `select message.*, user.* from message, user
                where message.author_id = user.user_id
                order by message.pub_date desc limit ?`,
        [PER_PAGE]
    );
    res.render('pages/timeline', {
        session_username: req.session.username,
        session_user_id: req.session.user_id,
        messages: messages
    });
});

// Register page
app.get('/register', function(req, res) {
    res.render('pages/register', {
        username: '',
        email: '',
    });
});

// Register handler
app.post('/register', async function(req, res) {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    const password2 = req.body.password2;
    let error;
    if(!username) {
        error = 'You have to enter a username';
    } else if (!email || !email.includes('@')) {
        error = 'You have to enter a valid email address';
    } else if (!password) {
        error = 'You have to enter a password';
    } else if (password !== password2) {
        error = 'The two passwords do not match';
    } else if (await selectOne('SELECT 1 FROM user WHERE username = ?',[username])) {
        error = 'The username is already taken';
    } else {
        await insertOne(
            'INSERT INTO user(username, email, pw_hash) VALUES(?, ?, ?)',
            [username, email, password.lameHash()]);
        return res.render('pages/login', {
            username: username,
            flashes: ['You were successfully registered and can login now']
        });

    }
    res.render('pages/register', {
        username: username,
        email: email,
        error: error
    });
});

// User timeline page
app.get('/:username', async function(req, res) {
    const { username } = req.params;
    let profile_user = await selectOne(
        'SELECT * FROM user WHERE username = ?',
        [username]);
    if(!profile_user) {
        return res.status(404).send();
    }

    let followed;
    if(req.session.user_id) {
        followed = await selectOne(
            'SELECT 1 FROM follower WHERE follower.who_id = ? and follower.whom_id = ?',
            [req.session.user_id, profile_user.user_id]);
    }

    let messages = await selectAll(
        `SELECT message.*, user.* FROM message, user WHERE
                user.user_id = message.author_id AND user.user_id = ?
                ORDER BY message.pub_date DESC LIMIT ?`,
        [profile_user.user_id, PER_PAGE]
    );

    res.render('pages/timeline', {
        session_username: req.session.username,
        session_user_id: req.session.user_id,
        profile_username: profile_user.username,
        profile_user_id: profile_user.user_id,
        followed: !!followed,
        messages: messages
    });
});

// Start application
app.listen(8080);
console.log('MiniTwit is running on port 8080..');

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
