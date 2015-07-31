process.env.NODE_ENV = 'test';

var Code = require('code');
var _ = require('lodash');
var Lab = require('lab');
var fixtures = require('./fixtures');
var lab = exports.lab = Lab.script();
var serverItems = require('../').getServer();
var DbHelper = require('./db-helper');
var authInject = require('./auth-inject');

var server = serverItems.server;
var dbHelper = new DbHelper(serverItems.db);

//server.on('request-error', function (request, error) {

    //console.log(error.stack);
//});

lab.experiment('user', function () {

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
            var user = payload.data.attributes;
            Code.expect(response.statusCode).to.equal(200);
            Code.expect(payload.data).to.include('id', 'type', 'attributes');
            Code.expect(user.login).to.equal(fixtures.users.main.login);
            Code.expect(user.name).to.equal(fixtures.users.main.name);
            Code.expect(user.email).to.equal(fixtures.users.main.email);
            Code.expect(user.validated).to.equal(true);
            Code.expect(user.public).to.equal(false);
            Code.expect(user.smartmode).to.equal(true);
            authUser = payload.data;
            done();
        });
    });

    lab.experiment('name, smartmode, public', function () {

        var user;

        lab.test('update', function (done) {

            var userAttributes = _.pick(fixtures.users.update, ['name', 'smartmode', 'public']);
            var options = {
                method: 'PUT', url: '/api/v1/me',
                payload: {
                    data: {
                        id: authUser.id,
                        type: 'user',
                        attributes: userAttributes
                    }
                }
            };
            authInject(server, options, userAuthHeader, function (response) {

                var payload = JSON.parse(response.payload);
                user = payload.data.attributes;
                Code.expect(response.statusCode).to.equal(200);
                Code.expect(payload.data).to.include('id', 'type', 'attributes');
                Code.expect(user.updatedAt).to.not.equal(authUser.attributes.updatedAt);
                authUser.attributes.updatedAt = user.updatedAt;
                Code.expect(userAttributes.name).to.equal(user.name);
                Code.expect(userAttributes.smartmode).to.equal(user.smartmode);
                Code.expect(userAttributes.public).to.equal(user.public);
                Code.expect(user.validated).to.equal(true);
                done();
            });
        });

        lab.test('persisted', function (done) {

            var options = {
                method: 'GET', url: '/api/v1/me'
            };
            authInject(server, options, userAuthHeader, function (response) {

                var payload = JSON.parse(response.payload);
                Code.expect(response.statusCode).to.equal(200);
                Code.expect(user).to.deep.equal(payload.data.attributes);
                done();
            });
        });
    });

    lab.experiment('update email', function () {

        var user;

        lab.test('same email', function (done) {

            var options = {
                method: 'PUT', url: '/api/v1/me',
                payload: {
                    data: {
                        id: authUser.id,
                        type: 'user',
                        attributes: {
                            email: fixtures.users.main.email
                        }
                    }
                }
            };
            authInject(server, options, userAuthHeader, function (response) {

                var payload = JSON.parse(response.payload);
                user = payload.data.attributes;
                Code.expect(response.statusCode).to.equal(200);
                Code.expect(user.updatedAt).to.not.equal(authUser.attributes.updatedAt);
                authUser.attributes.updatedAt = user.updatedAt;
                Code.expect(user.validated).to.equal(true);
                done();
            });
        });

        lab.test('persisted', function (done) {

            var options = {
                method: 'GET', url: '/api/v1/me'
            };
            authInject(server, options, userAuthHeader, function (response) {

                var payload = JSON.parse(response.payload);
                Code.expect(response.statusCode).to.equal(200);
                Code.expect(user).to.deep.equal(payload.data.attributes);
                done();
            });
        });
    });

    lab.experiment('update email', function (done) {

        var user;
        lab.test('different email', function (done) {

            var options = {
                method: 'PUT', url: '/api/v1/me',
                payload: {
                    data: {
                        id: authUser.id,
                        type: 'user',
                        attributes: {
                            email: fixtures.users.update.email
                        }
                    }
                }
            };
            authInject(server, options, userAuthHeader, function (response) {

                var payload = JSON.parse(response.payload);
                user = payload.data.attributes;
                Code.expect(response.statusCode).to.equal(200);
                Code.expect(user.updatedAt).to.not.equal(authUser.attributes.updatedAt);
                authUser.attributes.updatedAt = user.updatedAt;
                Code.expect(user.validated).to.equal(false);
                Code.expect(user.email).to.equal(fixtures.users.update.email);
                done();
            });
        });

        lab.test('persisted', function (done) {

            var options = {
                method: 'GET', url: '/api/v1/me'
            };
            authInject(server, options, userAuthHeader, function (response) {

                var payload = JSON.parse(response.payload);
                Code.expect(response.statusCode).to.equal(200);
                Code.expect(user).to.deep.equal(payload.data.attributes);
                done();
            });
        });
    });

    lab.experiment('update password', function () {

        lab.test('change', function (done) {

            var options = {
                method: 'PUT', url: '/api/v1/me',
                payload: {
                    data: {
                        id: authUser.id,
                        type: 'user',
                        attributes: {
                            password: fixtures.users.update.password,
                            passwordConfirm: fixtures.users.update.password
                        }
                    }
                }
            };
            authInject(server, options, userAuthHeader, function (response) {

                var payload = JSON.parse(response.payload);
                Code.expect(response.statusCode).to.equal(200);
                done();
            });
        });

        lab.test('login', function (done) {

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
                            email: fixtures.users.update.email,
                            password: fixtures.users.update.password
                        }
                    }
                }
            };
            return server.inject(options, function (response) {

                var payload = JSON.parse(response.payload);
                Code.expect(response.statusCode).to.equal(201);
                Code.expect(payload.data).to.include('id', 'type', 'attributes');
                Code.expect(payload.data.type).to.equal('authToken');
                Code.expect(payload.data.id).to.equal(authUser.id);

                return done();
            });
        });
    });
});
