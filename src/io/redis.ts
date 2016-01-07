import g = require('../global');

import ioredis = require('ioredis');

/**
 * Creates new redis instance using an config name
 * @param name
 */
export function createInstance(name: string): ioredis.ioredis {
    var config = g.Config.redis[name];
    var options = {
        host: config.host,
        family: config.ipv,
        port: config.port,
        password: config.password,
        db: config.database
    };

    // remove auth if no auth required
    if (options.password == '') {
        delete options.password;
    }

    return new ioredis(options);
}
