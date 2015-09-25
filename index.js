'use strict';
const Config = require('getconfig');
const Hapi = require('hapi');
const server = new Hapi.Server();
const Hoek = require('hoek');
const db = require('./db')(Config);
const Utils = require('./utils');

const plugins = [{
    register: require('@gar/hapi-json-api'),
    options: { meta: Config.meta }
}, {
    register: require('hapi-auth-jwt'),
    options: {}
}, {
    register: require('good'),
    options: {
        reporters: [{
            reporter: require('good-console'),
            events: Config.hapi.logEvents
        }]
    }
}];

server.app.utils = Utils;

Utils.transportLog(server.log.bind(server));

const connection = {
    host: Config.hapi.host,
    port: Config.hapi.port,
    router: { stripTrailingSlash: true }
};

if (Config.clientUri) {
    connection.routes = {
        cors: {
            origin: [Config.clientUri]
        }
    };
}

server.connection(connection);

server.register(plugins, function (err) {

    Hoek.assert(!err, 'Failed loading plugins: ' + err);

    server.register({
        register: require('./api/v1'),
        options: { config: Config, db: db }
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
        utils: Utils,
        db: db
    };
};
