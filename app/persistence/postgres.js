const { Pool } = require('pg')

const pool = new Pool({
    user: 'minitwit',
    host: 'db-postgresql-fra1-98386-do-user-3696963-0.db.ondigitalocean.com',
    database: 'minitwit',
    password: 'secret123shhhhhhhhhh',
    port: 25060,
    ssl: true
})

// the pool will emit an error on behalf of any idle clients
// it contains if a backend error or network partition happens
pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err)
    process.exit(-1)
})

//// Database helper functions
// Select only 1 row
function selectOne(query, params) {
    return new Promise((resolve, reject) => {
        pool.query(query, params, (err, res) => {
            if (err) {
                console.error(err);
                reject()
            }
            resolve(res.rows[0]);
        })
    });
}
// Select multiple rows
function selectAll(query, params) {
    return new Promise((resolve, reject) => {
        pool.query(query, params, (err, res) => {
            if (err) {
                console.error(err);
                reject()
            }
            resolve(res.rows);
        })
    });
}
// Insert 1 row
function insertOne(query, params) {
    return new Promise((resolve, reject) => {
        pool.query(query, params, (err, res) => {
            if (err) {
                console.error(err);
                reject()
            }
            resolve();
        })
    });
}

// Delete row(s)
function deleteRows(query, params) {
    return new Promise((resolve, reject) => {
        pool.query(query, params, (err, res) => {
            if (err) {
                console.error(err);
                reject()
            }
            resolve();
        })
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
