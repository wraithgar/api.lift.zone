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

lab.experiment('user activities', function () {

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

    lab.test('all - empty', function (done) {

        const options = {
            method: 'GET', url: '/api/v1/activityNames'
        };
        AuthInject(server, options, userAuthHeader, function (response) {

            const payload = JSON.parse(response.payload);
            Code.expect(response.statusCode).to.equal(200);
            Code.expect(payload.data).to.have.length(0);
            done();
        });
    });

    lab.test('suggestions - empty', function (done) {

        const options = {
            method: 'GET', url: '/api/v1/suggestions/activityName/' + Fixtures.activities.squat.name
        };
        AuthInject(server, options, userAuthHeader, function (response) {

            const payload = JSON.parse(response.payload);
            Code.expect(response.statusCode).to.equal(200);
            Code.expect(payload.data).to.part.include(Fixtures.activities.squat);
            Code.expect(payload.data).to.include('suggestions');
            Code.expect(payload.data).to.not.include('id');
            Code.expect(payload.data.suggestions).to.be.empty();
            done();
        });
    });

    lab.test('create', function (done) {

        const options = {
            method: 'POST', url: '/api/v1/activityNames',
            payload: {
                name: Fixtures.activities.squat.name
            }
        };
        AuthInject(server, options, userAuthHeader, function (response) {

            const payload = JSON.parse(response.payload);
            Code.expect(response.statusCode).to.equal(201);
            Fixtures.activities.squat.id = payload.data.id;
            done();
        });
    });

    lab.test('get created', function (done) {

        const options = {
            method: 'GET', url: '/api/v1/activityNames/' + Fixtures.activities.squat.id
        };
        AuthInject(server, options, userAuthHeader, function (response) {

            const payload = JSON.parse(response.payload);
            Code.expect(response.statusCode).to.equal(200);
            Code.expect(payload.data).to.part.include(Fixtures.activities.squat);
            done();
        });

    });

    lab.test('suggestions - non exact match', function (done) {

        const options = {
            method: 'GET', url: '/api/v1/suggestions/activityName/' + Fixtures.activities.barbellsquat.name
        };
        AuthInject(server, options, userAuthHeader, function (response) {

            const payload = JSON.parse(response.payload);
            Code.expect(response.statusCode).to.equal(200);
            Code.expect(payload.data).to.part.include(Fixtures.activities.barbellsquat);
            Code.expect(payload.data).to.include('suggestions');
            Code.expect(payload.data).to.not.include('id');
            Code.expect(payload.data.suggestions).to.have.length(1);
            Code.expect(payload.data.suggestions[0]).to.part.include(Fixtures.activities.squat);
            done();
        });
    });

    lab.test('create alias', function (done) {

        const options = {
            method: 'POST', url: '/api/v1/activityNames',
            payload: {
                name: Fixtures.activities.barbellsquat.name,
                aliasId: Fixtures.activities.squat.id
            }
        };
        AuthInject(server, options, userAuthHeader, function (response) {

            const payload = JSON.parse(response.payload);
            Code.expect(response.statusCode).to.equal(201);
            Fixtures.activities.barbellsquat.id = payload.data.id;
            Code.expect(payload.data).to.part.include(Fixtures.activities.barbellsquat);
            Code.expect(payload.data).to.include(['aliases', 'aliasOf']);
            Code.expect(payload.data.aliases).to.be.empty();
            Code.expect(payload.data.aliasOf).to.include(Fixtures.activities.squat);
            done();
        });
    });

    lab.test('create invalid alias', function (done) {

        const options = {
            method: 'POST', url: '/api/v1/activityNames',
            payload: {
                name: Fixtures.activities.barbellsquat.name,
                aliasId: 9999
            }
        };
        AuthInject(server, options, userAuthHeader, function (response) {

            Code.expect(response.statusCode).to.equal(404);
            done();
        });
    });

    lab.test('get alias', function (done) {

        const options = {
            method: 'GET', url: '/api/v1/activityNames/' + Fixtures.activities.barbellsquat.id
        };
        AuthInject(server, options, userAuthHeader, function (response) {

            const payload = JSON.parse(response.payload);
            Code.expect(response.statusCode).to.equal(200);
            Code.expect(payload.data).to.part.include(Fixtures.activities.barbellsquat);
            Code.expect(payload.data).to.include(['aliases', 'aliasOf']);
            Code.expect(payload.data.aliases).to.be.empty();
            Code.expect(payload.data.aliasOf).to.include(Fixtures.activities.squat);
            done();
        });

    });

    lab.test('get original now with alias', function (done) {

        const options = {
            method: 'GET', url: '/api/v1/activityNames/' + Fixtures.activities.squat.id
        };
        AuthInject(server, options, userAuthHeader, function (response) {

            const payload = JSON.parse(response.payload);
            Code.expect(response.statusCode).to.equal(200);
            Code.expect(payload.data).to.include(Fixtures.activities.squat);
            Code.expect(payload.data.aliases).to.have.length(1);
            Code.expect(payload.data.aliases).to.deep.include(Fixtures.activities.barbellsquat);
            done();
        });
    });

    lab.test('suggest - exact match', function (done) {

        const options = {
            method: 'GET', url: '/api/v1/suggestions/activityName/' + Fixtures.activities.squat.name
        };
        AuthInject(server, options, userAuthHeader, function (response) {

            const payload = JSON.parse(response.payload);
            Code.expect(response.statusCode).to.equal(200);
            Code.expect(payload.data).to.include(Fixtures.activities.squat);
            Code.expect(payload.data).to.not.include(['suggestions']);
            done();
        });
    });

    lab.test('suggestions - exact alias match', function (done) {

        const options = {
            method: 'GET', url: '/api/v1/suggestions/activityName/' + Fixtures.activities.barbellsquat.name
        };
        AuthInject(server, options, userAuthHeader, function (response) {

            const payload = JSON.parse(response.payload);
            Code.expect(response.statusCode).to.equal(200);
            Code.expect(payload.data).to.include(Fixtures.activities.barbellsquat);
            Code.expect(payload.data).to.not.include(['suggestions']);
            done();
        });
    });

    lab.test('suggestions - fuzzy match', function (done) {

        const options = {
            method: 'GET', url: '/api/v1/suggestions/activityName/' + Fixtures.activities.frontsquat.name
        };
        AuthInject(server, options, userAuthHeader, function (response) {

            const payload = JSON.parse(response.payload);
            Code.expect(response.statusCode).to.equal(200);
            Code.expect(payload.data).to.include(Fixtures.activities.frontsquat);
            Code.expect(payload.data.suggestions).to.have.length(2);
            Code.expect(payload.data.suggestions).to.deep.include(Fixtures.activities.squat);
            Code.expect(payload.data.suggestions).to.deep.include(Fixtures.activities.barbellsquat);
            done();
        });
    });
});
