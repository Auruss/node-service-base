import winston = require('winston');
import global = require('../global');
import es = require('../io/es');

export class LogstashTransport implements winston.Transport {
    public name: string;
    private _esClient: es.ElasticSearchQueue;


    /**
     * Constructs this transport
     */
    constructor() {
        this.name = "Logstash Transport";

        this._esClient = new es.ElasticSearchQueue('logstash', {
            'log': {
                'properties': {
                    'requestId': { type: 'string', store: true },
                    'message': { type: 'string', store: true},
                    'payload': { type: 'object', store: true, dynamic: true }
                }
            }
        });
    }

    on() {

    }

    /**
     * Creates a new logging entry
     * @param level log level
     * @param msg message
     * @param meta custom meta data
     * @param callback success callback
     */
    log(level: string, msg: string, meta: any, callback: any) {
        if (global.Config.logging.logstash.indexOf(level) == -1) return;

        // read requestid and payload if given
        var requestId = 0;
        var payload = {};

        if (typeof meta !=  'undefined') {
            if (typeof meta.requestId != 'undefined') {
                requestId = meta.requestId;
            }
            if (typeof meta.payloadData != 'undefined') {
                payload = meta.payloadData;
            }
        }


        this._esClient.addEntry('log', {
            message: msg,
            requestId: requestId,
            payload: payload
        });
    }
}
