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

server.on('request-error', function (request, err) {

    console.log(err.stack);
});

lab.experiment('user activities', function () {

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

    lab.test('all - empty', function (done) {

        var options = {
            method: 'GET', url: '/api/v1/activityNames'
        };
        authInject(server, options, userAuthHeader, function (response) {

            var payload = JSON.parse(response.payload);
            Code.expect(response.statusCode).to.equal(200);
            Code.expect(payload.data).to.have.length(0);
            done();
        });
    });

    lab.test('search - empty', function (done) {

        var options = {
            method: 'POST', url: '/api/v1/search/activityNames',
            payload: {
                name: fixtures.activities.squat.name
            }
        };
        authInject(server, options, userAuthHeader, function (response) {

            var payload = JSON.parse(response.payload);
            Code.expect(response.statusCode).to.equal(200);
            Code.expect(payload.data).to.have.length(0);
            done();
        });
    });

    lab.test('create', function (done) {

        var options = {
            method: 'POST', url: '/api/v1/activityNames',
            payload: {
                name: fixtures.activities.squat.name
            }
        };
        authInject(server, options, userAuthHeader, function (response) {

            var payload = JSON.parse(response.payload);
            Code.expect(response.statusCode).to.equal(201);
            fixtures.activities.squat.id = payload.data.id;
            done();
        });
    });

    lab.test('get created', function (done) {

        var options = {
            method: 'GET', url: '/api/v1/activityNames/' + fixtures.activities.squat.id
        };
        authInject(server, options, userAuthHeader, function (response) {

            var payload = JSON.parse(response.payload);
            Code.expect(response.statusCode).to.equal(200);
            Code.expect(payload.data.attributes.name).to.equal(fixtures.activities.squat.name);
            Code.expect(payload.data.relationships).to.include('aliases');
            Code.expect(payload.data.relationships.aliases.data).to.be.empty();
            done();
        });

    });

    lab.test('create alias', function (done) {

        var options = {
            method: 'POST', url: '/api/v1/activityNames',
            payload: {
                name: fixtures.activities.barbellsquat.name,
                useractivityId: fixtures.activities.squat.id
            }
        };
        authInject(server, options, userAuthHeader, function (response) {

            var payload = JSON.parse(response.payload);
            Code.expect(response.statusCode).to.equal(201);
            fixtures.activities.barbellsquat.id = payload.data.id;
            done();
        });
    });

    lab.test('get alias', function (done) {

        var options = {
            method: 'GET', url: '/api/v1/activityNames/' + fixtures.activities.barbellsquat.id
        };
        authInject(server, options, userAuthHeader, function (response) {

            var payload = JSON.parse(response.payload);
            Code.expect(response.statusCode).to.equal(200);
            Code.expect(payload.data.attributes.name).to.equal(fixtures.activities.barbellsquat.name);
            Code.expect(payload.data.relationships).to.include('aliases');
            Code.expect(payload.data.relationships.aliases.data).to.be.empty();
            done();
        });

    });

    lab.test('get original now with alias', function (done) {

        var options = {
            method: 'GET', url: '/api/v1/activityNames/' + fixtures.activities.squat.id
        };
        authInject(server, options, userAuthHeader, function (response) {

            var payload = JSON.parse(response.payload);
            Code.expect(response.statusCode).to.equal(200);
            Code.expect(payload.data.attributes.name).to.equal(fixtures.activities.squat.name);
            Code.expect(payload.data.relationships).to.include('aliases');
            Code.expect(payload.data.relationships.aliases.data).to.have.length(1);
            done();
        });
    });

    lab.test('search - not empty', function (done) {

        var options = {
            method: 'POST', url: '/api/v1/search/activityNames',
            payload: {
                name: fixtures.activities.squat.name
            }
        };
        authInject(server, options, userAuthHeader, function (response) {

            var payload = JSON.parse(response.payload);
            Code.expect(response.statusCode).to.equal(200);
            Code.expect(payload.data).to.have.length(2);
            done();
        });
    });
});
