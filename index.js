'use strict';
var config = require('getconfig');
var Hapi = require('hapi');
var server = new Hapi.Server();
var Hoek = require('hoek');
var db = require('./db')(config);
var utils = require('./utils');

var plugins = [{
    register: require('@gar/hapi-json-api'),
    options: {meta: config.meta}
}, {
    register: require('hapi-auth-jwt'),
    options: {}
}, {
    register: require('good'),
    options: {
        reporters: [{
            reporter: require('good-console'),
            events: config.hapi.logEvents
        }]
    }
}];

server.app.utils = utils;

server.connection({
    host: config.hapi.host,
    port: config.hapi.port
});

server.register(plugins, function (err) {

    Hoek.assert(!err, 'Failed loading plugins: ' + err);

    server.register({
        register: require('./api/v1'),
        options: { config: config, db: db }
    }, { routes: { prefix: '/api/v1' } }, function (err) {

        Hoek.assert(!err, 'Failed loading api: ' + err);

        server.start(function (err) {

            Hoek.assert(!err, 'Failed starting server: ' + err);

            server.log(['info', 'startup'], 'Server is running on: ' + server.info.uri);
        });
    });
});

exports.getServer = function () {

    return {
        server: server,
        utils: utils,
        db: db
    };
};
