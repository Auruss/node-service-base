import winston = require('winston');
import pmx = require('pmx');
import g = require('../global');

export class pm2Transport implements winston.Transport {
    name: string;

    constructor() {
        this.name = "PM2 Transport";
    }

    on() {
    }

    /**
     * Logs the message to pm2 dashboard
     * @param level log level
     * @param msg message
     * @param meta custom meta data
     * @param callback success callback
     */
    log(level: string, msg: string, meta: any, callback: any) {
        if (g.Config.logging.pm2.indexOf(level) == -1) return;

        pmx.emit('logging:' + level, {
            'msg': msg,
            'level': level,
            'meta': meta
        });

        callback(null, true);
    }
}