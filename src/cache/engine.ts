import g = require('../global');
import q = require('q');

export interface CacheEngine {
    read(key: string): q.Promise<any>;
    write(key: string, data: any, ttl: number): q.Promise<void>;
}

interface CacheEngineDirectory {
    [name: string]: CacheEngine;
}

// engines
import redisEngine = require('./engines/redis');

var _engines: CacheEngineDirectory = {};

// init engines
export function init() {
    // init engines
    for (var cfg in g.Config.cache) {
        if (g.Config.cache[cfg].engine.type == 'redis') {
            _engines[cfg] = redisEngine.getInstance(g.Config.cache[cfg].engine.config);
        }
    }
}

/**
 * Reads from cache
 *
 * @param type
 * @param key
 */
export function read(type: string, key: string): q.Promise<any> {
    var cfg = g.Config.cache[type];
    return _engines[type].read(cfg.prefix + key);
}

/**
 * Writes to cache
 *
 * @param type
 * @param key
 * @param data
 */
export function write(type: string, key: string, data: any): q.Promise<void> {
    var cfg = g.Config.cache[type];
    return _engines[type].write(cfg.prefix + key, data, cfg.ttl);
}


import crypto = require('crypto');

/**
 * Gets an unique key from options object
 * @param object
 */
export function getOptionKey(object: any) {
    return crypto.createHash('md5').update(JSON.stringify(object)).digest('hex');
}