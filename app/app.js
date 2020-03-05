// Express web framework https://expressjs.com/
const express = require('express');
// Sessions https://github.com/expressjs/session#readme
const cookieParser = require('cookie-parser');
const session = require('express-session');
const webRouter = require('./routers/web_router');
const apiRouter = require('./routers/api_router');

//setting current dir
const path = '/Users/admin/Code/minitwit/app/'

const SECRET = 'shhhhhhhhhh';

// === Web app ===

const web = express();
// EJS template engine https://ejs.co/
web.set('view engine', 'ejs');
web.set('views', path + 'views'); //custom path

// Static files
web.use(express.static(path + 'static'));
// Form data
web.use(express.urlencoded())
// Sessions
web.use(cookieParser());
web.use(session({secret: SECRET}));
web.use('/', webRouter);
web.listen(8080, () => console.log('Minitwit web app listening on port 8080.'));

// === Web API ===

const api = express();
api.use(express.json());

api.use('/', apiRouter)
api.listen(9090, () => console.log('Minitwit API listening on port 9090.'));