const express = require('express');
const logger = require('../utils/logger');
const db = require('../persistence/postgres');
const helpers = require('../utils/helpers');
const router = express.Router();

const PER_PAGE = 20;

// Home (User feed or redirect to public timeline)
router.get('/', async function(req, res) {
    if(!req.session.user_id) {
        return res.redirect('/public')
    }
    let messages = await db.selectAll(
        `SELECT * FROM message m
                LEFT JOIN "user" u ON m.author_id = u.user_id
                WHERE (
                u.user_id = $1 OR
                u.user_id IN (
                SELECT whom_id FROM follower
                WHERE who_id = $2))
                ORDER BY m.pub_date DESC LIMIT $3`,
        [req.session.user_id, req.session.user_id, PER_PAGE]
    );
    res.render('pages/timeline', {
        session_username: req.session.username,
        session_user_id: req.session.user_id,
        messages: messages,
        myFeed: true,
        helpers: helpers
    });
});

// Public timeline page
router.get('/public', async function(req, res) {
    let messages = await db.selectAll(
        `SELECT * FROM message m
                LEFT JOIN "user" u ON m.author_id = u.user_id
                ORDER BY m.pub_date DESC LIMIT $1`,
        [PER_PAGE]
    );
    res.render('pages/timeline', {
        session_username: req.session.username,
        session_user_id: req.session.user_id,
        messages: messages,
        helpers: helpers
    });
});

// Add message handler
router.post('/add_message', async function(req, res) {
    const user_id = req.session.user_id;
    const text = req.body.text;
    if(!user_id) {
        return res.status(401).send();
    } else {
        await db.insertOne(
            'INSERT INTO message(author_id, text, pub_date) VALUES($1, $2, $3)',
            [user_id, text, Date.now()])
        let messages = await db.selectAll(
            `SELECT * FROM message m
                    LEFT JOIN "user" u ON m.author_id = u.user_id
                    WHERE (
                    u.user_id = $1 OR
                    u.user_id IN (
                    SELECT whom_id FROM follower
                    WHERE who_id = $2))
                    ORDER BY m.pub_date DESC LIMIT $3`,
            [req.session.user_id, req.session.user_id, PER_PAGE]
        );
        return res.render('pages/timeline', {
            flashes: ['Your message was recorded'],
            session_user_id: req.session.user_id,
            session_username: req.session.username,
            messages: messages,
            myFeed: true,
            helpers: helpers
        });
    }
});

// Register page
router.get('/register', function(req, res) {
    res.render('pages/register', {
        username: '',
        email: '',
    });
});

// Register handler
router.post('/register', async function(req, res) {
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
    } else if (await db.selectOne('SELECT 1 FROM "user" WHERE username = $1',[username])) {
        error = 'The username is already taken';
    } else {
        await db.insertOne(
            'INSERT INTO "user"(username, email, pw_hash) VALUES($1, $2, $3)',
            [username, email, db.lameHash(password)]);
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

// Login page
router.get('/login', function(req, res) {
    res.render('pages/login', {
        username: '',
    });
});

// Login handler
router.post('/login', async function(req, res) {
    const username = req.body.username;
    const password = req.body.password;
    let error;
    if(!username) {
        error = 'You have to enter a username';
    } else if (!password) {
        error = 'You have to enter a password';
    } else {
        const user = await db.selectOne('SELECT * FROM "user" WHERE username = $1',[username])
        if(!user) {
            error = 'Invalid username';
        } else if (user.pw_hash !== db.lameHash(password)) {
            error = 'Invalid password';
        } else {
            req.session.user_id = user.user_id;
            req.session.username = username;
            let messages = await db.selectAll(
                `SELECT * FROM message m
                        LEFT JOIN "user" u ON m.author_id = u.user_id
                        WHERE (
                        u.user_id = $1 OR
                        u.user_id IN (
                        SELECT whom_id FROM follower
                        WHERE who_id = $2))
                        ORDER BY m.pub_date DESC LIMIT $3`,
                [req.session.user_id, req.session.user_id, PER_PAGE]
            );
            return res.render('pages/timeline', {
                flashes: ['You were logged in'],
                session_user_id: req.session.user_id,
                session_username: req.session.username,
                messages,
                helpers: helpers
            });
        }
    }
    res.render('pages/login', {
        username: username,
        error: error
    });
});

// Logout
router.get('/logout', function(req, res) {
    req.session.user_id = null;
    req.session.username = null;
    res.render('pages/timeline', {
        flashes: ['You were logged out']
    });
});

// User timeline page
router.get('/:username', async function(req, res) {
    const { username } = req.params;
    let profile_user = await db.selectOne(
        'SELECT * FROM "user" WHERE username = $1',
        [username]);
    if(!profile_user) {
        return res.status(404).send();
    }

    let followed;
    if(req.session.user_id) {
        followed = await db.selectOne(
            'SELECT 1 FROM follower WHERE follower.who_id = $1 and follower.whom_id = $2',
            [req.session.user_id, profile_user.user_id]);
    }

    let messages = await db.selectAll(
        `SELECT * FROM message m
                LEFT JOIN "user" u ON m.author_id = u.user_id
                WHERE u.user_id = $1
                ORDER BY m.pub_date DESC LIMIT $2`,
        [profile_user.user_id, PER_PAGE]
    );

    res.render('pages/timeline', {
        session_username: req.session.username,
        session_user_id: req.session.user_id,
        profile_username: profile_user.username,
        profile_user_id: profile_user.user_id,
        followed: !!followed,
        messages: messages,
        helpers: helpers
    });
});

router.get('/:username/follow', async function(req, res) {
    const { username } = req.params;
    if (!req.session.user_id)
        res.status(401).send();
    let whom = await db.selectOne('SELECT * FROM "user" WHERE username = $1',[username]);
    if (!whom)
        res.status(404).send();
    await db.insertOne('INSERT INTO follower (who_id, whom_id) VALUES ($1, $2)', [req.session.user_id, whom.user_id])

    return res.redirect('/' + username);
});

router.get('/:username/unfollow', async function(req, res) {
    const { username } = req.params;
    if (!req.session.user_id)
        res.status(401).send();
    let whom = await db.selectOne('SELECT * FROM "user" WHERE username = $1',[username]);
    if (!whom)
        res.status(404).send();
    await db.deleteRows('DELETE FROM follower WHERE who_id = $1 AND whom_id = $2', [req.session.user_id, whom.user_id]);

    return res.redirect('/' + username);
});





module.exports = router;
