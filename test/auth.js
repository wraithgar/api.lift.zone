process.env.NODE_ENV = 'test';

var Code = require('code');
var Hoek = require('hoek');
var Lab = require('lab');
var fixtures = require('./fixtures');
var lab = exports.lab = Lab.script();
var serverItems = require('../').getServer();
var DbHelper = require('./db-helper');
var authInject = require('./auth-inject');

var server = serverItems.server;
var dbHelper = new DbHelper(serverItems.db);

lab.experiment('authentication', function () {

    var authUser;
    var userAuthHeader;

    lab.before(function (done) {

        return dbHelper.rollbackAll().then(function () {

            return dbHelper.migrateLatest();
        }).then(function () {

            return dbHelper.createUser(fixtures.users.main);
        }).then(function () {

            server.start(function () {

                var options = {
                    method: 'POST', url: '/api/v1/login',
                    headers: {
                        accept: 'application/vnd.api+json',
                        'content-type': 'application/vnd.api+json'
                    },
                    payload: {
                        data: {
                            type: 'login',
                            attributes: {
                                email: fixtures.users.main.email,
                                password: fixtures.users.main.password
                            }
                        }
                    }
                };
                return server.inject(options, function (response) {

                    var payload = JSON.parse(response.payload);
                    Code.expect(response.statusCode).to.equal(201);
                    Code.expect(payload.data).to.include('id', 'type', 'attributes');
                    Code.expect(payload.data.type).to.equal('authToken');
                    userAuthHeader = {
                        authorization: 'Bearer ' + payload.data.attributes.token
                    };

                    return done();
                });
            });
        });
    });

    lab.test('me', function (done) {

        var options = {
            method: 'GET', url: '/api/v1/me'
        };
        authInject(server, options, userAuthHeader, function (response) {

            var payload = JSON.parse(response.payload);
            Code.expect(response.statusCode).to.equal(200);
            Code.expect(payload.data).to.include('id', 'type', 'attributes');
            authUser = payload.data;
            done();
        });
    });

    lab.test('logout', function (done) {

        var options = {
            method: 'POST', url: '/api/v1/logout'
        };
        authInject(server, options, userAuthHeader, function (response) {

            Code.expect(response.statusCode).to.equal(204);
            Code.expect(response.payload).to.be.empty();
            done();
        });
    });

    lab.test('logged out', function (done) {

        var options = {
            method: 'GET', url: '/api/v1/me'
        };
        authInject(server, options, userAuthHeader, function (response) {

            Code.expect(response.statusCode).to.equal(401);
            done();
        });
    });

    lab.test('login invalid username', function (done) {

        var options = {
            method: 'POST', url: '/api/v1/login',
            headers: {
                accept: 'application/vnd.api+json',
                'content-type': 'application/vnd.api+json'
            },
            payload: {
                data: {
                    type: 'login',
                    attributes: {
                        email: 'bad' + fixtures.users.main.email,
                        password: fixtures.users.main.password
                    }
                }
            }
        };
        server.inject(options, function (response) {

            Code.expect(response.statusCode).to.equal(404);
            done();
        });
    });

    lab.test('login invalid password', function (done) {

        var options = {
            method: 'POST', url: '/api/v1/login',
            headers: {
                accept: 'application/vnd.api+json',
                'content-type': 'application/vnd.api+json'
            },
            payload: {
                data: {
                    type: 'login',
                    attributes: {
                        email: fixtures.users.main.email,
                        password: fixtures.users.main.password + 'bad'
                    }
                }
            }
        };
        server.inject(options, function (response) {

            Code.expect(response.statusCode).to.equal(404);
            done();
        });
    });
});
