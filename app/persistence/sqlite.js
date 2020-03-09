// SQLite3 https://github.com/mapbox/node-sqlite3
// const path = require('path')
// const dbPath = path.resolve(__dirname, 'minitwit.db')
const sqlite3 = require('sqlite3').verbose();
const models = require('../../models');
const sequelize = require('sequelize');
/*let db = new sqlite3.Database('/Users/rdmo/Documents/ITU/MSc\ Computer\ Science/2.\ Semester/DevOps/minitwit/app/persistence/minitwit.db', (err) => {
    // let db = new sqlite3.Database('/tmp/minitwit.db', (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('Connected to the minitwit.db SQlite database.');
});

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
        db.run(query, params, function (err) {
            if (err) {
                console.error(err.message);
                reject();
            }
            // Return the last inserted id
            resolve(this.lastID)
        });
    });
}

// Delete row(s)
function deleteRows(query, params) {
    return new Promise((resolve, reject) => {
        db.run(query, params, function (err) {
            if (err) {
                console.error(err.message);
                reject();
            }
            // Return the deleted
            resolve(this.changes);
        });
    });
}*/

// Lame password hash function
// TODO Use proper hashing library, bcrypt maybe?
function lameHash(string) {
    let hash = 0;
    if (string.length === 0) {
        return hash;
    }
    for (let i = 0; i < string.length; i++) {
        let char = String(string).charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return 'lame' + hash + 'hash';
}

// `SELECT message.*, user.* FROM message, user
//                 WHERE message.author_id = user.user_id AND (
//                     user.user_id = ? OR
//                     user.user_id IN (
//                         SELECT whom_id FROM follower
//                         WHERE who_id = ?))
//                 ORDER BY message.pub_date DESC LIMIT ?`,
//         [req.session.user_id, req.session.user_id, PER_PAGE]


//  let messages = await db.selectAll(
//     `select message.*, user.* from message, user
//                 where message.author_id = user.user_id
//                 order by message.pub_date desc limit ?`,
//     [PER_PAGE]
// );
async function getAllMessagesForUser(userId, perPage) {
    return new Promise((resolve, reject) => {
        models.follower.findAll({
            attributes: [
                'whom_id'
            ],
            where: {
                who_id: userId,
            }
        }).then((followed) => {
            models.message.findAll({
                include: [
                    {
                        model: models.user,
                    },
                ],
                where: {
                    author_id: userId,
                    // $and: {
                    //     user_id: userId,
                    // $or: {
                    //     userId: {
                    //         $in: followed,
                    //     }
                    // }
                    // }
                },


                order: [['pub_date', 'DESC']],
                limit: perPage,
            }).then((messages) => {
                // console.log("MESSAGESSSSSSSS");

                // console.log(messages);
                if (messages) {
                    reject()
                }
                else {
                    var refinedMessages = [];
                    messages.forEach((msg) => {
                        console.log(msg)
                        const msgData = msg.dataValues;
                        // console.log(msgData);
                        const userData = msgData.user.dataValues;
                        // console.log(userData);
                        refinedMessages.push(
                            {
                                message_id: msgData.message_id,
                                author_id: msgData.author_id,
                                text: msgData.text,
                                pub_date: msgData.pub_date,
                                username: userData.username,
                            }
                        );
                    });
                    // console.log(refinedMessages);
                    resolve(refinedMessages);
                }

            });
        });


    }).catch((err) => {
        console.log(err);
    });
}

async function getUser(username) {
    return new Promise((resolve, reject) => {
        var user = models.user.findOne({
            where: {
                username: username
            },
        }).then(user => user);
        if (user == null) {
            console.log("No user found");
            reject();
        } else {
            console.log("User" + user);
            resolve(user);
        }
    }).catch((err) => {
        console.log(err);
    });
}

async function getMessagesForUserProfile(userId, perPage) {
    return new Promise((resolve, reject) => {
        models.message.findAll({
            include: [
                {
                    model: models.user,
                },
            ],
            where: {
                author_id: userId,
            },
            limit: perPage,
        }).then(messages => {
            // console.log("MESSAGESSSSSSSS");

            // console.log(messages);
            var refinedMessages = [];
            messages.forEach((msg) => {
                const msgData = msg.dataValues;
                // console.log(msgData);
                const userData = msgData.user.dataValues;
                // console.log(userData);
                refinedMessages.push(
                    {
                        message_id: msgData.message_id,
                        author_id: msgData.author_id,
                        text: msgData.text,
                        pub_date: msgData.pub_date,
                        username: userData.username,
                    }
                );
            });
            // console.log(refinedMessages);
            resolve(refinedMessages);
        }).catch((err) => {
            console.log(err);
        });
    });
}

async function createUser(username, email, password) {
    return new Promise((resolve, reject) => {
        models.user.create({
            username: username,
            email: email,
            pw_hash: password,
        })
            .then(user => resolve(user.username))
            .catch(function (err) {
                console.log(err);
                reject();
            });
    }).catch((err) => { console.log(err) });
}

async function getFollower(sessionUserId, profileUserId) {
    return new Promise((resolve, reject) => {
        models.follower.findOne({
            where: {
                who_id: sessionUserId,
                whom_id: profileUserId,

            }
        })
            .then(follower => resolve(follower))
            .catch(function (err) {
                console.log(err);
                reject();
            });
    }).catch((err) => { console.log(err) });
}


async function getAllPublic(perPage) {
    return new Promise((resolve, reject) => {
        models.message.findAll({
            raw: false,
            include: [{
                model: models.user,
            }],
            order: [['pub_date', 'DESC']],
            limit: perPage,
        }).then((messages) => {
            var refinedMessages = [];
            messages.forEach((msg) => {
                const msgData = msg.dataValues;
                const userData = msgData.user.dataValues;
                refinedMessages.push(
                    {
                        message_id: msgData.message_id,
                        author_id: msgData.author_id,
                        text: msgData.text,
                        pub_date: msgData.pub_date,
                        username: userData.username,
                    }
                );
            });
            resolve(refinedMessages);
        }).catch(err => reject(err));
    }).catch((err) => { console.log(err) });
}

async function addMessage(userId, text, date) {
    return new Promise((resolve, reject) => {
        models.message.create({
            author_id: userId,
            text: text,
            pub_date: date,
        }).then((messages) => resolve(messages)).catch(err => reject(err));
    }).catch((err) => { console.log(err) });
}

async function follow(who, whom) {
    console.log('whom ' + whom)
    return new Promise((resolve, reject) => {
        models.follower.create({
            who_id: who,
            whom_id: whom,
        }).then(follower => resolve(follower)).catch((err) => {console.log(err); reject()});
    })
}

async function unfollow(who, whom) {
    return new Promise((resolve, reject) => {
        getFollower(who, whom)
            .then((follower) => {
                follower.destroy()
                    .then((response) => resolve(response))
                    .catch((err) => reject())
            })
            .catch((err) => console.log(err));
    })
}

module.exports = {
    /*selectOne,
    selectAll,
    insertOne,
    deleteRows,*/
    lameHash,
    getUser,
    createUser,
    getAllMessagesForUser,
    getAllPublic,
    addMessage,
    getFollower,
    getMessagesForUserProfile,
    follow,
    unfollow,
};
