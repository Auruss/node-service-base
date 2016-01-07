import q = require("q");

interface AuthToken {
    gameIdentifier: number;
}

/**
 * Returns all data for an hash
 * @param hash
 */
export function getDataForHash(hash: string): q.Promise<AuthToken> {
    // TODO: Grab data from redis/mysql
    var deferred = q.defer<AuthToken>();
    deferred.resolve({ gameIdentifier: 0 });

    return deferred.promise;
}

