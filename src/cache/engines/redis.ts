import winston = require('winston');

import engine = require('../engine');
import redis = require('../../io/redis');

import q = require('q');
import ioredis = require('ioredis');

var _instances = {};

/**
 * Creates gets an RedisEngine instance
 *
 * @param configName
 * @returns {any}
 */
export function getInstance(configName: string) {
    if (typeof _instances[configName] == 'undefined') {
        _instances[configName] = new RedisEngine(configName);
    }

    return _instances[configName];
}

/**
 * Implements an cache engine
 */
export class RedisEngine implements engine.CacheEngine {
    private _client: ioredis.ioredis;

    constructor(name) {
        this._client = redis.createInstance(name);
    }

    read(key: string): q.Promise<any> {
        var def = q.defer<void>();

        this._client.get(key).then((data) => {
            if (data != null) {
                def.resolve(JSON.parse(data));
            } else {
                def.reject('key');
            }
        }, (reason: string) => {
            winston.error('Redis exception: ' + reason);
            def.reject(reason);
        });

        return def.promise;
    }

    write(key: string, data: any, ttl: number): q.Promise<any> {
        var def = q.defer<void>();

        this._client.set(key, JSON.stringify(data)).then(() => {
            this._client.expire(key, ttl).then((result) => {
                def.resolve(result);
            }, (reason) => {
                winston.error('Redis exception: ' + reason);
                def.reject(reason);
            });
        }, (reason: string) => {
            winston.error('Redis exception: ' + reason);
            def.reject(reason);
        });

        return def.promise;
    }
}