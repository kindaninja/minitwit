// Express web framework https://expressjs.com/
const express = require('express');
// Sessions https://github.com/expressjs/session#readme
const cookieParser = require('cookie-parser');
const session = require('express-session');
const bodyParser = require('body-parser');

const SECRET = 'shhhhhhhhhh';

// === Web app ===
const web = express();
// EJS template engine https://ejs.co/
web.set('view engine', 'ejs');
// Static files
web.use(express.static('static'));
// Form data
web.use(express.urlencoded())
// Sessions
web.use(cookieParser());
web.use(session({secret: SECRET}));

// === Web API ===
const api = express();