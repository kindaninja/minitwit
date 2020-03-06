
const express = require('express');
const db = require('../persistence/sqlite');
const router = express.Router();

const PER_PAGE = 20;

// Home (User feed or redirect to public timeline)
router.get('/', async function(req, res) {
    if(!req.session.user_id) {
        return res.redirect('/public')
    }
    let messages = await db.selectAll(
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
router.get('/public', async function(req, res) {
    // let messages = await db.selectAll(
    //     `select message.*, user.* from message, user
    //             where message.author_id = user.user_id
    //             order by message.pub_date desc limit ?`,
    //     [PER_PAGE]
    // );
    let messages = await db.getAllPublic(PER_PAGE);
    res.render('pages/timeline', {
        session_username: req.session.username,
        session_user_id: req.session.user_id,
        messages: messages,
    });
});

// Add message handler
router.post('/add_message', async function(req, res) {
    const user_id = req.session.user_id;
    const text = req.body.text;
    if(!user_id) {
        return res.status(401).send();
    } else {
        // await db.insertOne(
        //     'INSERT INTO message(author_id, text, pub_date) VALUES(?, ?, ?)',
        //     [user_id, text, Date.now()])
        await db.addMessage(user_id, text, Date.now())
        // let messages = await db.selectAll(
        //     `SELECT message.*, user.* FROM message, user
        //         WHERE message.author_id = user.user_id AND (
        //             user.user_id = ? OR
        //             user.user_id IN (
        //                 SELECT whom_id FROM follower
        //                 WHERE who_id = ?))
        //         ORDER BY message.pub_date DESC LIMIT ?`,
        //     [req.session.user_id, req.session.user_id, PER_PAGE]
        // );
        let messages = db.getAllPublic(PER_PAGE);
        // console.log("!!!!!!!Messages!!!!!!!!" + messages);
        return res.render('pages/timeline', {
            flashes: ['Your message was recorded'],
            session_user_id: req.session.user_id,
            session_username: req.session.username,
            messages: messages["User"],
            myFeed: true
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
    // } else if (await db.selectOne('SELECT 1 FROM user WHERE username = ?',[username])) {
    } else if (await db.getUser(username)) {
        error = 'The username is already taken';
    } else {
        await db.createUser(username, email, db.lameHash(password));
        await db.insertOne(
            'INSERT INTO user(username, email, pw_hash) VALUES(?, ?, ?)',
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
        const user = await db.selectOne('SELECT * FROM user WHERE username = ?',[username])
        if(!user) {
            error = 'Invalid username';
        } else if (user.pw_hash !== db.lameHash(password)) {
            error = 'Invalid password';
        } else {
            req.session.user_id = user.user_id;
            req.session.username = username;
            let messages = await db.selectAll(
                `SELECT message.*, user.* FROM message, user
                WHERE message.author_id = user.user_id AND (
                    user.user_id = ? OR
                    user.user_id IN (
                        SELECT whom_id FROM follower
                        WHERE who_id = ?))
                ORDER BY message.pub_date DESC LIMIT ?`,
                [req.session.user_id, req.session.user_id, PER_PAGE]
            );
            return res.render('pages/timeline', {
                flashes: ['You were logged in'],
                session_user_id: req.session.user_id,
                session_username: req.session.username,
                messages
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
        'SELECT * FROM user WHERE username = ?',
        [username]);
    if(!profile_user) {
        return res.status(404).send();
    }

    let followed;
    if(req.session.user_id) {
        followed = await db.selectOne(
            'SELECT 1 FROM follower WHERE follower.who_id = ? and follower.whom_id = ?',
            [req.session.user_id, profile_user.user_id]);
    }

    let messages = await db.selectAll(
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

router.get('/:username/follow', async function(req, res) {
    const { username } = req.params;
    if (!req.session.user_id)
        res.status(401).send();
    let whom = await db.selectOne('SELECT * FROM user WHERE username = ?',[username]);
    if (!whom)
        res.status(404).send();
    await db.insertOne('INSERT INTO follower (who_id, whom_id) VALUES (?, ?)', [req.session.user_id, whom.user_id])

    return res.redirect('/' + username);
});

router.get('/:username/unfollow', async function(req, res) {
    const { username } = req.params;
    if (!req.session.user_id)
        res.status(401).send();
    let whom = await db.selectOne('SELECT * FROM user WHERE username = ?',[username]);
    if (!whom)
        res.status(404).send();
    await db.deleteRows('DELETE FROM follower WHERE who_id = ? AND whom_id = ?', [req.session.user_id, whom.user_id]);

    return res.redirect('/' + username);
});




module.exports = router;