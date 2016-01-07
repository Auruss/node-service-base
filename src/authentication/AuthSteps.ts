import q = require('q');
import authToken = require('./AuthToken');

/**
 * Defines the first authentication based on the authtoken
 */
export function firstStepAuthentication(): q.IPromise<boolean> {
    var deferred: q.Deferred<boolean> = q.defer<boolean>();

    authToken.getDataForHash("123").then(
        (data) => {
            deferred.resolve(true);
        },
        (reason) => {
            deferred.reject(reason);
        });

    return deferred.promise;
}

/**
 * Defines the seconds authentication based on the session
 */
export function secondStepAuthentication() {

}