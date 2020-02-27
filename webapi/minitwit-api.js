// Express web framework https://expressjs.com/
const express = require('express');
const app = express();
const bodyParser = require('body-parser');

let LATEST = 0;

app.use(bodyParser.json());

// SQLite3 https://github.com/mapbox/node-sqlite3
const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('/tmp/minitwit.db', (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('Connected to the minitwit.db SQlite database.');
});

// Get latest value
app.get('/latest', function (req, res) {
   return res.json({"latest": LATEST});
});

// Register handler
app.post('/register', async function(req, res) {
    updateLatest(req);
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

// Public timeline page
app.get('/msgs', async function(req, res) {
    updateLatest(req);
    let not_from_sim = notReqFromSimulator(req);
    if (not_from_sim) {
        let error = "You are not authorized to use this resource!";
        return res.json({"status": 403, "error_msg": error}).status(403).send();
    }

    let no_msgs = req.query.no ? req.query.no : 100;
    let messages = await selectAll(
        `select message.*, user.* from message, user
                where message.author_id = user.user_id
                order by message.pub_date desc limit ?`,
        [no_msgs]
    );

    let filteredMsgs = [];
    messages.forEach(function(msg) {
        let filteredMsg = {};
        filteredMsg["content"] = msg["text"];
        filteredMsg["pub_date"] = msg["pub_date"];
        filteredMsg["user"] = msg["username"];
        filteredMsgs.push(filteredMsg);
    });
    return res.json(filteredMsgs);
});

app.get('/msgs/:username', async function(req, res) {
    updateLatest(req);

    let not_from_sim = notReqFromSimulator(req);
    if (not_from_sim) {
        let error = "You are not authorized to use this resource!";
        return res.json({"status": 403, "error_msg": error}).status(403).send();
    }
    const { username } = req.params;
    let no_msgs = req.query.no ? req.query.no : 100;

    let profile_user = await selectOne(
        'SELECT * FROM user WHERE username = ?',
        [username]);

    if(!profile_user) {
        return res.status(404).send();
    }

    let messages = await selectAll(
        `SELECT message.*, user.* FROM message, user WHERE
                user.user_id = message.author_id AND user.user_id = ?
                ORDER BY message.pub_date DESC LIMIT ?`,
        [profile_user.user_id, no_msgs]);

    let filteredMsgs = [];
    messages.forEach(function(msg) {
        let filteredMsg = {};
        filteredMsg["content"] = msg["text"];
        filteredMsg["pub_date"] = msg["pub_date"];
        filteredMsg["user"] = msg["username"];
        filteredMsgs.push(filteredMsg);
    });

    return res.json(filteredMsgs);
});

app.post('/msgs/:username', async function (req, res) {
    updateLatest(req);

    let not_from_sim = notReqFromSimulator(req);
    if (not_from_sim) {
        let error = "You are not authorized to use this resource!";
        return res.json({"status": 403, "error_msg": error}).status(403).send();
    }
    const { username } = req.params;
    let profile_user = await selectOne(
        'SELECT * FROM user WHERE username = ?',
        [username]);

    if(!profile_user) {
        return res.status(404).send();
    }

    let content = req.body.content;

    await insertOne(
        'INSERT INTO message(author_id, text, pub_date) VALUES(?, ?, ?)',
        [profile_user.user_id, content, Date.now()]);

    return res.status(204).send();
});

app.get('/fllws/:username', async function (req, res) {
    updateLatest(req);

    let not_from_sim = notReqFromSimulator(req);
    if (not_from_sim) {
        let error = "You are not authorized to use this resource!";
        return res.json({"status": 403, "error_msg": error}).status(403).send();
    }
    const { username } = req.params;

    let profile_user = await selectOne(
        'SELECT * FROM user WHERE username = ?',
        [username]);

    if(!profile_user) {
        return res.status(404).send();
    }

    let no_followers = req.query.no ? req.query.no : 100;

    let followers = await selectAll(
        `SELECT user.username FROM user
                INNER JOIN follower ON follower.whom_id = user.user_id
                WHERE follower.who_id = ?
                LIMIT ?`,
        [profile_user.user_id, no_followers]
    );
    let followers_names = [];
    followers.forEach((follower) => {
        followers_names.push(follower["username"])
    });

    return res.json({"follows": followers_names});
});

app.post('/fllws/:username', async function (req, res) {
    updateLatest(req);

    let not_from_sim = notReqFromSimulator(req);
    if (not_from_sim) {
        let error = "You are not authorized to use this resource!";
        return res.json({"status": 403, "error_msg": error}).status(403).send();
    }
    const { username } = req.params;

    let profile_user = await selectOne(
        'SELECT * FROM user WHERE username = ?',
        [username]);

    if(!profile_user) {
        return res.status(404).send();
    }

    if (req.body.follow) {
        let follow_username = req.body.follow;
        let follows_user = await selectOne(
            'SELECT * FROM user WHERE username = ?',
            [follow_username]);

        if (!follows_user) {
            return res.status(404).send();
        }

        await insertOne(
            'INSERT INTO follower (who_id, whom_id) VALUES (?, ?)',
            [profile_user.user_id, follows_user.user_id]);

        return res.status(204).send();
    }

    if (req.body.unfollow) {
        let unfollow_username = req.body.unfollow;
        let unfollows_user = await selectOne(
            'SELECT * FROM user WHERE username = ?',
            [unfollow_username]);

        if (!unfollows_user){
            return res.status(404).send();
        }

        await deleteRows(
            'DELETE FROM follower WHERE who_id = ? AND whom_id = ?',
            [profile_user.user_id, unfollows_user.user_id]);

        return res.status(204).send();
    }
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
            resolve(this.lastID);
        });
    });
}

// Delete row(s)
function deleteRows(query, params) {
    return new Promise((resolve, reject) => {
        db.run(query, params, function(err) {
            if (err) {
                console.error(err.message);
                reject();
            }
            // Return the deleted
            resolve(this.changes);
        });
    });
}

// Checks if simulator
function notReqFromSimulator(request) {
    let from_sim = request.headers.authorization;
    return from_sim !== "Basic c2ltdWxhdG9yOnN1cGVyX3NhZmUh";
}

// Update latest
function updateLatest(request) {
    let try_latest = request.query.latest ? request.query.latest : -1;
    LATEST = try_latest !== -1 ? parseInt(try_latest) : LATEST;
}

// Lame password hash function
// TODO Use proper hashing library, bcrypt maybe?
String.prototype.lameHash = function() {
    var hash = 0;
    if (this.length === 0) {
        return hash;
    }
    for (var i = 0; i < this.length; i++) {
        var char = this.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return 'lame' + hash + 'hash';
}
