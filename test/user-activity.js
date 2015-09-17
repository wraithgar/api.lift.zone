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

server.on('request-error', function (request, err) {

    console.log(err.stack);
});

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
                    headers: {
                        accept: 'application/vnd.api+json',
                        'content-type': 'application/vnd.api+json'
                    },
                    payload: {
                        data: {
                            type: 'login',
                            attributes: {
                                login: Fixtures.users.main.login,
                                password: Fixtures.users.main.password
                            }
                        }
                    }
                };
                return server.inject(options, function (response) {

                    const payload = JSON.parse(response.payload);
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

    lab.test('suggest - empty', function (done) {

        const options = {
            method: 'POST', url: '/api/v1/suggest/activityNames',
            payload: {
                name: Fixtures.activities.squat.name
            }
        };
        AuthInject(server, options, userAuthHeader, function (response) {

            const payload = JSON.parse(response.payload);
            Code.expect(response.statusCode).to.equal(200);
            Code.expect(payload.data).to.have.length(0);
            done();
        });
    });

    lab.test('search - empty', function (done) {

        const options = {
            method: 'POST', url: '/api/v1/search/activityNames',
            payload: {
                name: Fixtures.activities.squat.name
            }
        };
        AuthInject(server, options, userAuthHeader, function (response) {

            Code.expect(response.statusCode).to.equal(404);
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
            Code.expect(payload.data.attributes.name).to.equal(Fixtures.activities.squat.name);
            Code.expect(payload.data.relationships).to.include('aliases');
            Code.expect(payload.data.relationships.aliases.data).to.be.empty();
            done();
        });

    });

    lab.test('create alias', function (done) {

        const options = {
            method: 'POST', url: '/api/v1/activityNames',
            payload: {
                name: Fixtures.activities.barbellsquat.name,
                useractivityId: Fixtures.activities.squat.id
            }
        };
        AuthInject(server, options, userAuthHeader, function (response) {

            const payload = JSON.parse(response.payload);
            Code.expect(response.statusCode).to.equal(201);
            Fixtures.activities.barbellsquat.id = payload.data.id;
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
            Code.expect(payload.data.attributes.name).to.equal(Fixtures.activities.barbellsquat.name);
            Code.expect(payload.data.relationships).to.include('aliases');
            Code.expect(payload.data.relationships.aliases.data).to.be.empty();
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
            Code.expect(payload.data.attributes.name).to.equal(Fixtures.activities.squat.name);
            Code.expect(payload.data.relationships).to.include('aliases');
            Code.expect(payload.data.relationships.aliases.data).to.have.length(1);
            done();
        });
    });

    lab.test('suggest - not empty', function (done) {

        const options = {
            method: 'POST', url: '/api/v1/suggest/activityNames',
            payload: {
                name: Fixtures.activities.squat.name
            }
        };
        AuthInject(server, options, userAuthHeader, function (response) {

            const payload = JSON.parse(response.payload);
            Code.expect(response.statusCode).to.equal(200);
            Code.expect(payload.data).to.have.length(2);
            done();
        });
    });
});
