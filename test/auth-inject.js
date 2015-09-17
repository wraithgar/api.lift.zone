'use strict';
const Hoek = require('hoek');
const Code = require('code');

module.exports = function authInject (server, options, authHeader, next) {

    if (!options.headers) {
        options.headers = {};
    }
    options.headers.accept = 'application/vnd.api+json';
    if (options.payload) {
        options.headers['content-type'] = 'application/vnd.api+json';
    }
    const authOptions = Hoek.applyToDefaults({ headers: authHeader }, options);
    server.inject(options, function (response) {

        Code.expect(response.statusCode).to.equal(401);
        return server.inject(authOptions, next);
    });
};
