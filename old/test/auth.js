'use strict';
process.env.NODE_ENV = 'test';

const Code = require('code');
const Hoek = require('hoek');
const Lab = require('lab');
const Fixtures = require('./fixtures');
const lab = exports.lab = Lab.script();
const serverItems = require('../').getServer();
const DbHelper = require('./db-helper');
const AuthInject = require('./auth-inject');

const server = serverItems.server;
const Utils = serverItems.utils;
const dbHelper = new DbHelper(serverItems.db);

const mailLog = {};
const sendMail = function (options, callback) {

    if (!mailLog[options.to]) {
        mailLog[options.to] = [];
    }

    mailLog[options.to].push(options);

    if (callback) {
        return callback();
    }
};

lab.experiment('authentication', function () {

    let authUser;
    let userAuthHeader;
    let resetAuthHeader;
    let recoveryCode;

    lab.before(function (done) {

        Utils.transporter.sendMail = sendMail;
        return dbHelper.rollbackAll().then(function () {

            return dbHelper.migrateLatest();
        }).then(function () {

            return dbHelper.createUser(Fixtures.users.main);
        }).then(function () {

            server.start(function () {

                const options = {
                    method: 'POST', url: '/api/v1/login',
                    payload: {
                        login: Fixtures.users.main.login,
                        password: Fixtures.users.main.password
                    }
                };
                return server.inject(options, function (response) {

                    const payload = JSON.parse(response.payload);
                    Code.expect(response.statusCode).to.equal(201);
                    Code.expect(payload.data).to.include(['token']);
                    userAuthHeader = {
                        authorization: 'Bearer ' + payload.data.token
                    };

                    return done();
                });
            });
        });
    });

    lab.test('me', function (done) {

        const options = {
            method: 'GET', url: '/api/v1/me'
        };
        AuthInject(server, options, userAuthHeader, function (response) {

            const payload = JSON.parse(response.payload);
            Code.expect(response.statusCode).to.equal(200);
            Code.expect(payload.data).to.part.include(Fixtures.users.main);
            authUser = payload.data;
            done();
        });
    });

    lab.test('login invalid username', function (done) {

        const options = {
            method: 'POST', url: '/api/v1/login',
            payload: {
                login: 'bad' + Fixtures.users.main.login,
                password: Fixtures.users.main.password
            }
        };
        server.inject(options, function (response) {

            Code.expect(response.statusCode).to.equal(404);
            done();
        });
    });

    lab.test('login invalid password', function (done) {

        const options = {
            method: 'POST', url: '/api/v1/login',
            payload: {
                login: Fixtures.users.main.login,
                password: Fixtures.users.main.password + 'bad'
            }
        };
        server.inject(options, function (response) {

            Code.expect(response.statusCode).to.equal(404);
            done();
        });
    });

    lab.test('request recovery code', function (done) {

        const options = {
            method: 'POST', url: '/api/v1/recover',
            payload: {
                email: Fixtures.users.main.email
            }
        };
        server.inject(options, function (response) {

            const payload = JSON.parse(response.payload);
            //Wait for promises to fire asynchronously
            setTimeout(function () {

                Code.expect(response.statusCode).to.equal(202);
                Code.expect(payload.data).to.equal(null);
                Code.expect(mailLog[Fixtures.users.main.email]).to.have.length(1);
                recoveryCode = mailLog[Fixtures.users.main.email][0].text.split('code=')[1].split('\n')[0];
                done();
            }, 50);
        });
    });

    lab.test('re-request recovery code', function (done) {

        const options = {
            method: 'POST', url: '/api/v1/recover',
            payload: {
                email: Fixtures.users.main.email
            }
        };
        server.inject(options, function (response) {

            //Wait for promises to fire asynchronously
            setTimeout(function () {

                const payload = JSON.parse(response.payload);
                Code.expect(response.statusCode).to.equal(202);
                Code.expect(payload.data).to.equal(null);
                Code.expect(mailLog[Fixtures.users.main.email]).to.have.length(1);
                done();
            }, 50);
        });
    });

    lab.test('request recovery code nonexistant user', function (done) {

        const options = {
            method: 'POST', url: '/api/v1/recover',
            payload: {
                email: Fixtures.users.nonexistant.email
            }
        };
        server.inject(options, function (response) {

            const payload = JSON.parse(response.payload);
            Code.expect(response.statusCode).to.equal(202);
            Code.expect(payload.data).to.equal(null);
            Code.expect(mailLog[Fixtures.users.nonexistant.email]).to.equal(undefined);
            done();
        });
    });

    lab.test('reset password', function (done) {

        const options = {
            method: 'POST', url: '/api/v1/reset',
            payload: {
                code: recoveryCode,
                password: Fixtures.users.reset.password,
                passwordConfirm: Fixtures.users.reset.password
            }
        };
        server.inject(options, function (response) {

            const payload = JSON.parse(response.payload);
            Code.expect(response.statusCode).to.equal(201);
            Code.expect(payload.data).to.part.include(['token']);
            resetAuthHeader = {
                authorization: 'Bearer ' + payload.data.token
            };
            done();
        });
    });

    lab.test('reuse code', function (done) {

        const options = {
            method: 'POST', url: '/api/v1/reset',
            payload: {
                code: recoveryCode,
                password: Fixtures.users.main.password,
                passwordConfirm: Fixtures.users.main.password
            }
        };
        server.inject(options, function (response) {

            Code.expect(response.statusCode).to.equal(404);
            done();
        });
    });

    lab.test('logged out after reset', function (done) {

        const options = {
            method: 'GET', url: '/api/v1/me'
        };
        AuthInject(server, options, userAuthHeader, function (response) {

            Code.expect(response.statusCode).to.equal(401);
            done();
        });
    });

    lab.test('me with reset auth', function (done) {

        const options = {
            method: 'GET', url: '/api/v1/me'
        };
        AuthInject(server, options, resetAuthHeader, function (response) {

            const payload = JSON.parse(response.payload);
            Code.expect(response.statusCode).to.equal(200);
            Code.expect(payload.data).to.part.include(Fixtures.users.main);
            done();
        });
    });

    lab.test('logout', function (done) {

        const options = {
            method: 'POST', url: '/api/v1/logout'
        };
        AuthInject(server, options, resetAuthHeader, function (response) {

            Code.expect(response.statusCode).to.equal(204);
            Code.expect(response.payload).to.be.empty();
            done();
        });
    });

    lab.test('logged out', function (done) {

        const options = {
            method: 'GET', url: '/api/v1/me'
        };
        AuthInject(server, options, resetAuthHeader, function (response) {

            Code.expect(response.statusCode).to.equal(401);
            done();
        });
    });

    lab.test('log in with reset password', function (done) {

        const options = {
            method: 'POST', url: '/api/v1/login',
            payload: {
                login: Fixtures.users.main.login,
                password: Fixtures.users.reset.password
            }
        };
        server.inject(options, function (response) {

            const payload = JSON.parse(response.payload);
            Code.expect(response.statusCode).to.equal(201);
            Code.expect(payload.data).to.include(['token']);
            userAuthHeader = {
                authorization: 'Bearer ' + payload.data.token
            };

            return done();
        });
    });

    lab.test('me with reset logged in auth', function (done) {

        const options = {
            method: 'GET', url: '/api/v1/me'
        };
        AuthInject(server, options, userAuthHeader, function (response) {

            const payload = JSON.parse(response.payload);
            Code.expect(response.statusCode).to.equal(200);
            Code.expect(payload.data).to.include('id', 'type', 'attributes');
            done();
        });
    });
});
