'use strict';
process.env.NODE_ENV = 'test';

const Code = require('code');
const _ = require('lodash');
const Lab = require('lab');
const Fixtures = require('./fixtures');
const lab = exports.lab = Lab.script();
const serverItems = require('../').getServer();
const DbHelper = require('./db-helper');
const AuthInject = require('./auth-inject');

const server = serverItems.server;
const dbHelper = new DbHelper(serverItems.db);

lab.experiment('user', function () {

    let authUser;
    let userAuthHeader;

    lab.before(function (done) {

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
            const user = payload.data.attributes;
            Code.expect(response.statusCode).to.equal(200);
            Code.expect(payload.data).to.part.include(Fixtures.users.main);
            authUser = payload.data;
            done();
        });
    });

    lab.experiment('name, smartmode, visible', function () {

        let user;

        lab.test('update', function (done) {

            const userAttributes = _.pick(Fixtures.users.update, ['name', 'smartmode', 'visible']);
            const options = {
                method: 'PUT', url: '/api/v1/me',
                payload: userAttributes
            };
            AuthInject(server, options, userAuthHeader, function (response) {

                const payload = JSON.parse(response.payload);
                user = payload.data;
                Code.expect(response.statusCode).to.equal(200);
                Code.expect(payload.data).to.include('id', 'type', 'attributes');
                Code.expect(user.updatedAt).to.not.equal(authUser.updatedAt);
                authUser.updatedAt = user.updatedAt;
                Code.expect(userAttributes.name).to.equal(user.name);
                Code.expect(userAttributes.smartmode).to.equal(user.smartmode);
                Code.expect(userAttributes.visible).to.equal(user.visible);
                Code.expect(user.validated).to.equal(true);
                done();
            });
        });

        lab.test('persisted', function (done) {

            const options = {
                method: 'GET', url: '/api/v1/me'
            };
            AuthInject(server, options, userAuthHeader, function (response) {

                const payload = JSON.parse(response.payload);
                Code.expect(response.statusCode).to.equal(200);
                Code.expect(payload.data).to.deep.equal(user);
                done();
            });
        });
    });

    lab.experiment('update email', function () {

        let user;

        lab.test('same email', function (done) {

            const options = {
                method: 'PUT', url: '/api/v1/me',
                payload: {
                    email: Fixtures.users.main.email
                }
            };
            AuthInject(server, options, userAuthHeader, function (response) {

                const payload = JSON.parse(response.payload);
                user = payload.data;
                Code.expect(response.statusCode).to.equal(200);
                Code.expect(user.updatedAt).to.not.equal(authUser.updatedAt);
                authUser.updatedAt = user.updatedAt;
                Code.expect(user.validated).to.equal(true);
                done();
            });
        });

        lab.test('persisted', function (done) {

            const options = {
                method: 'GET', url: '/api/v1/me'
            };
            AuthInject(server, options, userAuthHeader, function (response) {

                const payload = JSON.parse(response.payload);
                Code.expect(response.statusCode).to.equal(200);
                Code.expect(user).to.deep.equal(payload.data);
                done();
            });
        });
    });

    lab.experiment('update email', function (done) {

        let user;
        lab.test('different email', function (done) {

            const options = {
                method: 'PUT', url: '/api/v1/me',
                payload: {
                    email: Fixtures.users.update.email
                }
            };
            AuthInject(server, options, userAuthHeader, function (response) {

                const payload = JSON.parse(response.payload);
                user = payload.data;
                Code.expect(response.statusCode).to.equal(200);
                Code.expect(user.updatedAt).to.not.equal(authUser.updatedAt);
                authUser.updatedAt = user.updatedAt;
                Code.expect(user.validated).to.equal(false);
                Code.expect(user.email).to.equal(Fixtures.users.update.email);
                done();
            });
        });

        lab.test('persisted', function (done) {

            const options = {
                method: 'GET', url: '/api/v1/me'
            };
            AuthInject(server, options, userAuthHeader, function (response) {

                const payload = JSON.parse(response.payload);
                Code.expect(response.statusCode).to.equal(200);
                Code.expect(payload.data).to.deep.equal(user);
                done();
            });
        });
    });

    lab.experiment('update password', function () {

        lab.test('change', function (done) {

            const options = {
                method: 'PUT', url: '/api/v1/me',
                payload: {
                    password: Fixtures.users.update.password,
                    passwordConfirm: Fixtures.users.update.password
                }
            };
            AuthInject(server, options, userAuthHeader, function (response) {

                const payload = JSON.parse(response.payload);
                Code.expect(response.statusCode).to.equal(200);
                done();
            });
        });

        lab.test('login', function (done) {

            const options = {
                method: 'POST', url: '/api/v1/login',
                payload: {
                    login: Fixtures.users.update.login,
                    password: Fixtures.users.update.password
                }
            };
            return server.inject(options, function (response) {

                const payload = JSON.parse(response.payload);
                Code.expect(response.statusCode).to.equal(201);
                Code.expect(payload.data).to.include(['token']);

                return done();
            });
        });
    });
});
