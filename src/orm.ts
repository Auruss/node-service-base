import g = require('./global');
import cache = require('./cache/engine');

import seq = require('sequelize');
import q = require('q');

var _config: g.ORMDB;
var _sequelize: seq.Sequelize;

/**
 * Initializes the ORM system
 *
 * @param name
 */
export function init(name: string) {
    _config = g.Config.orm[name];

    _sequelize = new seq(_config.database, _config.user, _config.password, {
        host: _config.host,
        port: _config.port,

        dialect: _config.dialect,

        pool: {
            max: 5,
            min: 0,
            idle: 10000
        }
    });
}

interface ModelDirectory {
    [name: string]: any;
}

var _models: ModelDirectory = {};

export interface SmartModel<T,TT> extends seq.Model<T, TT> {
    cached(type: string): seq.Model<T, TT>;
}

/**
 *  Defines a new model
 *
 * @param name
 * @param attributes
 * @returns {seq.Model}
 */
export function define<T, TT>(name: string, attributes: any): seq.Model<T, TT> {
    // do basic define
    _models[name] = _sequelize.define(name, attributes);

    // extend to create smart model
    var extender = (funs: string[]) => {
        var cached = {};

        funs.forEach((fun) => {
            cached[fun] = (options: any) => {
                var def = q.defer<any>();

                var key =_models[name].getTableName() + '_' + cache.getOptionKey(options);
                var type = _models[name]._cacheType;

                cache.read(type, key).then((data) => {
                    def.resolve(data);
                }, () => {
                    _models[name][fun](options).then((data) => {
                        cache.write(type, key, data);
                        def.resolve(data);
                    }, (reason: string) => {
                        def.reject(reason);
                    });
                });

                return def.promise;
            };
        });

        return cached;
    };

    _models[name]._cacheType = "default";
    _models[name]._cached = extender(['find', 'findAll']);

    _models[name].cached = (type: string) => {
        _models[name]._cacheType = type;
        return _models[name]._cached;
    };

    return _models[name];
}

/**
 * Gets a defined model
 *
 * @param name
 * @returns {seq.Model}
 */
export function getModel<T, TT>(name: string): SmartModel<T, TT> {
    return _models[name];
}