// Init config
export interface Http {
    authTokenHeader: string;
    prettyResponse: boolean;
}

export interface Network {
    port: number;
}

export interface API {
    url: string;
    authTokenHeader: string;
}

export interface ORMDB {
    dialect: string;
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
}

export interface ORM {
    [name: string]: ORMDB;
}

export interface ElasticSearch {
    host: string;
    index: string;
}

export interface ElasticSearchDirectory {
    [name: string]: ElasticSearch;
}

export interface Redis {
    host: string;
    port: number;
    ipv: number;
    password: string;
    database: number;
}

export interface RedisDirectory {
    [name: string]: Redis;
}

export interface Cache {
    engine: { type: string; config: string; };
    ttl: number;
    prefix: string;
}

export interface CacheDirectory {
    [name: string]: Cache;
}

export interface Logging {
    pm2: any[];
    logstash: string[];
}

export interface IConfig {
    http: Http;
    network: Network;
    api: API;
    orm: ORM;
    elasticSearch: ElasticSearchDirectory;
    redis: RedisDirectory;
    cache: CacheDirectory;
    logging: Logging;
}

export enum InstanceType {
    API,
    Admin,
    Website,
    Jobs
}

// get instance type
export var Instance: InstanceType = InstanceType.API;

process.argv.forEach((arg) => {
    if (arg == '--admin') {
        Instance = InstanceType.Admin;
    }
});

console.log('starting as', InstanceType[Instance], 'instance');

// init server
import hapi = require('hapi');
export var Server: hapi.Server;

// init config
export var Config: IConfig;

if (Instance == InstanceType.API) {
    Config = require("../../configs/api.json");
} else if (Instance == InstanceType.Admin) {
    Config = require("../../configs/admin.json");
}
