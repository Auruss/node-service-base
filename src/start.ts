import g = require('./global');

import controller = require('./controller');

// Init logging
import winston = require('winston');
winston.add(require('./logging/logstash').LogstashTransport, { });
winston.add(require('./logging/pm2').pm2Transport, { });
winston['level'] = 'debug';

// Init hapi
import hapi = require('hapi');

g.Server = new hapi.Server();
g.Server.connection( { port: g.Config['network']['port'] });
g.Server.start(() => {
    winston.info("Hapi Server started!");
});

// Init Cache
import cache = require('./cache/engine');
cache.init();

// Init metrics
import metrics = require('./metrics/logstash');
metrics.init();

// init loader
import loader = require('./loader');
loader.init();

import hapiAuth = require('./authentication/HapiIntegration');
import orm = require('./orm');

// init authentication pipeline
hapiAuth.integerate();

// init orm
orm.init('core');

// load
loader.loadController();
loader.loadModels();
