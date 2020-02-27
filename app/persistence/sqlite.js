// SQLite3 https://github.com/mapbox/node-sqlite3
const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('/minitwit.db', (err) => {
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

// Lame password hash function
// TODO Use proper hashing library, bcrypt maybe?
function lameHash(string) {
    let hash = 0;
    if (string.length === 0) {
        return hash;
    }
    for (let i = 0; i < string.length; i++) {
        let char = String(string).charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return 'lame' + hash + 'hash';
}

module.exports = {
    selectOne,
    selectAll,
    insertOne,
    deleteRows,
    lameHash
};
