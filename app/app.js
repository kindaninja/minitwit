// Express web framework https://expressjs.com/
const express = require('express');
const promMid = require('express-prometheus-middleware');
// Sessions https://github.com/expressjs/session#readme
const cookieParser = require('cookie-parser');
const session = require('express-session');

const webRouter = require('./routers/web_router');
const apiRouter = require('./routers/api_router');

const SECRET = 'shhhhhhhhhh';

// === Web app ===

const web = express();

// EJS template engine https://ejs.co/
web.set('view engine', 'ejs');
web.set('views', 'views');
// Static files
web.use(express.static('static'));
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
api.use(promMid({
    metricsPath: '/metrics',
    collectDefaultMetrics: true,
    requestDurationBuckets: [0.1, 0.5, 1, 1.5]
}));
api.listen(9090, () => console.log('Minitwit API listening on port 9090.'));
