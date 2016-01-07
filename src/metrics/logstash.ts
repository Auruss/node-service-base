import g = require("../global");
import logstash = require('../io/es');
import metrics = require('../metrics/logstash');

var _esClient: logstash.ElasticSearchQueue;

/**
 * Initializes the logstash metrics
 */
export function init() {
    _esClient = new logstash.ElasticSearchQueue('metrics', {
        'request': {
            properties: {
                requestId: { type: 'string', store: true },
                url: { type: 'string', store: true },
                requestSize: { type: 'integer', store: true }
            }
        },
        'errorResponse': {
            properties: {
                requestId: { type: 'string', store: true },
                url: { type: 'string', store: true },
                type: { type: 'string', store: true },
                httpStatus: { type: 'integer', store: true },
                detailMessage: { type: 'string', store: true }
            }
        },
        'successResponse': {
            properties: {
                requestId: { type: 'string', store: true },
                url: { type: 'string', store: true },
                responseSize: { type: 'integer', store: true }
            }
        }
    });

    g.Server.ext('onRequest', function (request, reply) {
        var reqSize: number = 0;
        if (typeof request.headers['Content-Length'] != 'undefined') {
            reqSize = parseInt(request.headers['Content-Length']);
        }

        metrics.putRequest(request.id, request.url.href, reqSize);

        return reply.continue();
    });
}

/**
 * Logs a new requests
 *
 * @param id
 * @param url
 * @param requestSize
 */
export function putRequest(id: number, url: string, requestSize: number) {
    _esClient.addEntry('request', {
        requestId: id,
        url: url,
        requestSize: requestSize
    });
}

/**
 * Logs a failed response
 *
 * @param id
 * @param url
 * @param type
 * @param status
 * @param msg
 */
export function putErrorResponse(id: number, url: string, type: string, status: number, msg: string) {
    _esClient.addEntry('errorResponse', {
        requestId: id,
        url: url,
        type: type,
        httpStatus: status,
        detailMessage: msg
    });
}

/**
 * Logs a succeeded response
 *
 * @param id
 * @param url
 * @param responseSize
 */
export function putSuccessResponse(id: number, url: string, responseSize: number) {
    _esClient.addEntry('successResponse', {
        requestId: id,
        url: url,
        responseSize: responseSize
    });
}
