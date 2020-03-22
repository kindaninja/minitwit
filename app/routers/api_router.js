const express = require('express');
const db = require('../persistence/postgres');
const router = express.Router();


let LATEST = 0;

// Get latest value
router.get('/latest', function (req, res) {
    return res.json({"latest": LATEST});
});

// Register handler
router.post('/register', async function(req, res) {
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
    } else if (await db.selectOne('SELECT 1 FROM "user" WHERE username = $1',[username])) {
        error = 'The username is already taken';
    } else {
        await db.insertOne(
            'INSERT INTO "user"(username, email, pw_hash) VALUES($1, $2, $3)',
            [username, email, db.lameHash(password)]);
        return res.status(204).send();

    }
    return res.status(400).json({"status": 400, "error_msg": error});
});

// Public timeline page
router.get('/msgs', async function(req, res) {
    updateLatest(req);
    let not_from_sim = notReqFromSimulator(req);
    if (not_from_sim) {
        let error = "You are not authorized to use this resource!";
        return res.status(403).json({"status": 403, "error_msg": error});
    }

    let no_msgs = req.query.no ? req.query.no : 100;
    let messages = await db.selectAll(
        `SELECT * FROM message m
                LEFT JOIN "user" u ON m.author_id = u.user_id
                ORDER BY m.pub_date desc limit $1`,
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

router.get('/msgs/:username', async function(req, res) {
    updateLatest(req);

    let not_from_sim = notReqFromSimulator(req);
    if (not_from_sim) {
        let error = "You are not authorized to use this resource!";
        return res.status(403).json({"status": 403, "error_msg": error});
    }
    const { username } = req.params;
    let no_msgs = req.query.no ? req.query.no : 100;

    let profile_user = await db.selectOne(
        'SELECT * FROM "user" WHERE username = $1',
        [username]);

    if(!profile_user) {
        return res.status(404).send();
    }

    let messages = await db.selectAll(
        `SELECT * FROM message m
                LEFT JOIN "user" u ON m.author_id = u.user_id
                WHERE u.user_id = $1
                ORDER BY m.pub_date DESC LIMIT $2`,
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

router.post('/msgs/:username', async function (req, res) {
    updateLatest(req);

    let not_from_sim = notReqFromSimulator(req);
    if (not_from_sim) {
        let error = "You are not authorized to use this resource!";
        return res.status(403).json({"status": 403, "error_msg": error});
    }
    const { username } = req.params;
    let profile_user = await db.selectOne(
        'SELECT * FROM "user" WHERE username = $1',
        [username]);

    if(!profile_user) {
        return res.status(404).send();
    }

    let content = req.body.content;

    await db.insertOne(
        'INSERT INTO message(author_id, text, pub_date) VALUES($1, $2, $3)',
        [profile_user.user_id, content, Date.now()]);

    return res.status(204).send();
});

router.get('/fllws/:username', async function (req, res) {
    updateLatest(req);

    let not_from_sim = notReqFromSimulator(req);
    if (not_from_sim) {
        let error = "You are not authorized to use this resource!";
        return res.status(403).json({"status": 403, "error_msg": error});
    }
    const { username } = req.params;

    let profile_user = await db.selectOne(
        'SELECT * FROM "user" WHERE username = $1',
        [username]);

    if(!profile_user) {
        return res.status(404).send();
    }

    let no_followers = req.query.no ? req.query.no : 100;

    let followers = await db.selectAll(
        `SELECT u.username FROM "user" u
                INNER JOIN follower ON follower.whom_id = u.user_id
                WHERE follower.who_id = $1
                LIMIT $2`,
        [profile_user.user_id, no_followers]
    );
    let followers_names = [];
    followers.forEach((follower) => {
        followers_names.push(follower["username"])
    });

    return res.json({"follows": followers_names});
});

router.post('/fllws/:username', async function (req, res) {
    updateLatest(req);

    let not_from_sim = notReqFromSimulator(req);
    if (not_from_sim) {
        let error = "You are not authorized to use this resource!";
        return res.status(403).json({"status": 403, "error_msg": error});
    }
    const { username } = req.params;

    let profile_user = await db.selectOne(
        'SELECT * FROM "user" WHERE username = $1',
        [username]);

    if(!profile_user) {
        return res.status(404).send();
    }

    if (req.body.follow) {
        let follow_username = req.body.follow;
        let follows_user = await db.selectOne(
            'SELECT * FROM "user" WHERE username = $1',
            [follow_username]);

        if (!follows_user) {
            return res.status(404).send();
        }

        await db.insertOne(
            'INSERT INTO follower (who_id, whom_id) VALUES ($1, $2)',
            [profile_user.user_id, follows_user.user_id]);

        return res.status(204).send();
    }

    if (req.body.unfollow) {
        let unfollow_username = req.body.unfollow;
        let unfollows_user = await db.selectOne(
            'SELECT * FROM "user" WHERE username = $1',
            [unfollow_username]);

        if (!unfollows_user){
            return res.status(404).send();
        }

        await db.deleteRows(
            'DELETE FROM follower WHERE who_id = $1 AND whom_id = $2',
            [profile_user.user_id, unfollows_user.user_id]);

        return res.status(204).send();
    }
});

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

module.exports = router;
