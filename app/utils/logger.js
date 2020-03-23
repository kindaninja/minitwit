let log4js = require('log4js');
log4js.configure({
    appenders: {
        logstash: { type: '@log4js-node/logstash-http', url: 'http://logstash:9696', application: 'logstash-log4js', logType: 'application', logChannel: 'node' }
    },
    categories: {
        default: { appenders: [ 'logstash' ], level: 'info' }
    }
});

let logger = log4js.getLogger();

module.exports = logger;
