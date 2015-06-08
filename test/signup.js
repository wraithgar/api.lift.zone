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

server.on('request-error', function (request, err) {

    console.log('error', err.stack);
});

lab.experiment('signups and invites', function () {

    var authUser;
    var userAuthHeader;
    var inviteCode;

    lab.before(function (done) {

        return dbHelper.rollbackAll().then(function () {

            return dbHelper.migrateLatest();
        }).then(function () {

            return dbHelper.createUser(fixtures.users.main);
        }).then(function () {

            return dbHelper.createInvites(fixtures.users.main, 5);
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

    lab.test('get invites', function (done) {

        var options = {
            method: 'GET', url: '/api/v1/me/invites'
        };
        authInject(server, options, userAuthHeader, function (response) {

            var payload = JSON.parse(response.payload);
            Code.expect(response.statusCode).to.equal(200);
            Code.expect(payload.data).to.have.length(5);
            inviteCode = payload.data[0];
            done();
        });
    });

    lab.experiment('signup using invite', function () {

        var signupUser;
        var signupUserAuthHeader;

        lab.test('sign up', function (done) {

            var invite = Hoek.applyToDefaults(fixtures.users.signup, {invite: inviteCode.attributes.code, passwordConfirm: fixtures.users.signup.password});
            var options = {
                method: 'POST', url: '/api/v1/signup',
                headers: {
                    accept: 'application/vnd.api+json',
                    'content-type': 'application/vnd.api+json'
                },
                payload: {
                    data: {
                        type: 'invite',
                        attributes: invite
                    }
                }
            };
            server.inject(options, function (response) {

                var payload = JSON.parse(response.payload);
                Code.expect(response.statusCode).to.equal(201);
                Code.expect(payload.data).to.include('id', 'type', 'attributes');
                Code.expect(payload.data.type).to.equal('authToken');
                signupUserAuthHeader = {
                    authorization: 'Bearer ' + payload.data.attributes.token
                };
                done();
            });
        });

        lab.test('invite got used', function (done) {

            var options = {
                method: 'GET', url: '/api/v1/me/invites'
            };
            authInject(server, options, userAuthHeader, function (response) {

                var payload = JSON.parse(response.payload);
                Code.expect(response.statusCode).to.equal(200);
                Code.expect(payload.data).to.have.length(4);
                done();
            });
        });

        lab.test('reuse signup token', function (done) {

            var invite = Hoek.applyToDefaults(fixtures.users.signup, {invite: inviteCode.attributes.code, passwordConfirm: fixtures.users.signup.password});
            var options = {
                method: 'POST', url: '/api/v1/signup',
                headers: {
                    accept: 'application/vnd.api+json',
                    'content-type': 'application/vnd.api+json'
                },
                payload: {
                    data: {
                        type: 'invite',
                        attributes: invite
                    }
                }
            };
            server.inject(options, function (response) {

                var payload = JSON.parse(response.payload);
                Code.expect(response.statusCode).to.equal(404);
                done();
            });
        });
    });
});
