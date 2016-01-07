import hapi = require('hapi');

import g = require("../global");
import metric = require('../metrics/logstash');

function getFailedAuthReply(reason: string): any {
    var response = {
        raws: {},
        models: {},
        errors: {
            "INVALID_AUTH": reason
        }
    };

    return response;
}

/* Hapi Auth Schemes */
function firstStepScheme(server: hapi.Server, options: any) {
    return {
        authenticate(request: hapi.Request, reply: hapi.IReply): any {
            var token = g.Config.http.authTokenHeader.toLowerCase();
            if (!(token in request.headers)) {
                var response = <hapi.Response>reply(getFailedAuthReply("No Auth Token header found"));
                response.statusCode = 401;

                metric.putErrorResponse(request.id, request.url.href, "INVALID_AUTH", 401, "No Auth  Token header found");
                return response;
            }

            return reply.continue({ credentials: token });
        }
    };
}

/**
 * Integrates the internal authentication process into the hapi server pipeline
 */
export function integerate() {
    // register hapi auth scheme
    g.Server.auth.scheme('firstStep', firstStepScheme);
    g.Server.auth.strategy('firstStep', 'firstStep', true);
}