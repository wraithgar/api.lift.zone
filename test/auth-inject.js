'use strict';
const Hoek = require('hoek');
const Code = require('code');

module.exports = function authInject (server, options, authHeader, next) {

    if (!options.headers) {
        options.headers = {};
    }

    const authOptions = Hoek.applyToDefaults({ headers: authHeader }, options);
    server.inject(options, function (response) {

        Code.expect(response.statusCode).to.equal(401);
        return server.inject(authOptions, next);
    });
};
