// SQLite3 https://github.com/mapbox/node-sqlite3
// const path = require('path')
// const dbPath = path.resolve(__dirname, 'minitwit.db')
const sqlite3 = require('sqlite3').verbose();
const models = require('../../models');


let db = new sqlite3.Database('/Users/rdmo/Documents/ITU/MSc\ Computer\ Science/2.\ Semester/DevOps/minitwit/app/persistence/minitwit.db', (err) => {
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
}

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

async function getUser(username) {
    return new Promise((resolve, reject) => {
        var user = models.User.findOne({
            where: {
                username: username
              },
        }).then(user => user);
        if(user == null) {
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

async function createUser(username, email, password) {
    return new Promise((resolve, reject) => {
        models.User.create({
            username: username,
            email: email,
            pw_hash: password,
        })
        .then(user => resolve(user.username))
        .catch(function (err) {
            console.log(err);
            reject();
        });
    }).catch((err) => {console.log(err)});
}

module.exports = {
    selectOne,
    selectAll,
    insertOne,
    deleteRows,
    lameHash,
    getUser,
    createUser,
};
