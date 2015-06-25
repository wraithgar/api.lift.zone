process.env.NODE_ENV = 'test';

var Code = require('code');
var Hoek = require('hoek');
var Lab = require('lab');
var nodemailer = require('nodemailer');
var fixtures = require('./fixtures');
var lab = exports.lab = Lab.script();
var serverItems = require('../').getServer();
var DbHelper = require('./db-helper');
var authInject = require('./auth-inject');

var server = serverItems.server;
var utils = serverItems.utils;
var dbHelper = new DbHelper(serverItems.db);

var mailLog = {};
var sendMail = function (options, callback) {

    if (!mailLog[options.to]) {
        mailLog[options.to] = [];
    }

    mailLog[options.to].push(options);

    if (callback) {
        return callback();
    }
};


server.on('request-error', function (request, error) {

    console.log(error.stack);
});

lab.experiment('authentication', function () {

    var authUser;
    var userAuthHeader;
    var resetAuthHeader;
    var recoveryCode;

    lab.before(function (done) {

        nodemailer.createTransport = function () {

            return {sendMail: sendMail};
        };
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

    lab.test('request recovery code', function (done) {

        var options = {
            method: 'POST', url: '/api/v1/recover',
            headers: {
                accept: 'application/vnd.api+json',
                'content-type': 'application/vnd.api+json'
            },
            payload: {
                data: {
                    type: 'login',
                    attributes: {
                        email: fixtures.users.main.email
                    }
                }
            }
        };
        server.inject(options, function (response) {

            var payload = JSON.parse(response.payload);
            //Wait for promises to fire asynchronously
            setTimeout(function () {

                Code.expect(response.statusCode).to.equal(202);
                Code.expect(payload.data).to.equal(null);
                Code.expect(mailLog[fixtures.users.main.email]).to.have.length(1);
                recoveryCode = mailLog[fixtures.users.main.email][0].text.split('code=')[1].split('\n')[0];
                done();
            }, 50);
        });
    });

    lab.test('re-request recovery code', function (done) {

        var options = {
            method: 'POST', url: '/api/v1/recover',
            headers: {
                accept: 'application/vnd.api+json',
                'content-type': 'application/vnd.api+json'
            },
            payload: {
                data: {
                    type: 'login',
                    attributes: {
                        email: fixtures.users.main.email
                    }
                }
            }
        };
        server.inject(options, function (response) {

            //Wait for promises to fire asynchronously
            setTimeout(function () {

                var payload = JSON.parse(response.payload);
                Code.expect(response.statusCode).to.equal(202);
                Code.expect(payload.data).to.equal(null);
                Code.expect(mailLog[fixtures.users.main.email]).to.have.length(1);
                done();
            }, 50);
        });
    });

    lab.test('request recovery code nonexistant user', function (done) {

        var options = {
            method: 'POST', url: '/api/v1/recover',
            headers: {
                accept: 'application/vnd.api+json',
                'content-type': 'application/vnd.api+json'
            },
            payload: {
                data: {
                    type: 'login',
                    attributes: {
                        email: fixtures.users.nonexistant.email
                    }
                }
            }
        };
        server.inject(options, function (response) {

            var payload = JSON.parse(response.payload);
            Code.expect(response.statusCode).to.equal(202);
            Code.expect(payload.data).to.equal(null);
            Code.expect(mailLog[fixtures.users.nonexistant.email]).to.equal(undefined);
            done();
        });
    });

    lab.test('reset password', function (done) {

        var options = {
            method: 'POST', url: '/api/v1/reset',
            headers: {
                accept: 'application/vnd.api+json',
                'content-type': 'application/vnd.api+json'
            },
            payload: {
                data: {
                    type: 'reset',
                    attributes: {
                        code: recoveryCode,
                        password: fixtures.users.reset.password,
                        passwordConfirm: fixtures.users.reset.password
                    }
                }
            }
        };
        server.inject(options, function (response) {

            var payload = JSON.parse(response.payload);
            Code.expect(response.statusCode).to.equal(201);
            Code.expect(payload.data).to.include('id', 'type', 'attributes');
            resetAuthHeader = {
                authorization: 'Bearer ' + payload.data.attributes.token
            };
            done();
        });
    });

    lab.test('reuse code', function (done) {

        var options = {
            method: 'POST', url: '/api/v1/reset',
            headers: {
                accept: 'application/vnd.api+json',
                'content-type': 'application/vnd.api+json'
            },
            payload: {
                data: {
                    type: 'reset',
                    attributes: {
                        code: recoveryCode,
                        password: fixtures.users.main.password,
                        passwordConfirm: fixtures.users.main.password
                    }
                }
            }
        };
        server.inject(options, function (response) {

            Code.expect(response.statusCode).to.equal(404);
            done();
        });
    });

    lab.test('logged out after reset', function (done) {

        var options = {
            method: 'GET', url: '/api/v1/me'
        };
        authInject(server, options, userAuthHeader, function (response) {

            Code.expect(response.statusCode).to.equal(401);
            done();
        });
    });

    lab.test('me with reset auth', function (done) {

        var options = {
            method: 'GET', url: '/api/v1/me'
        };
        authInject(server, options, resetAuthHeader, function (response) {

            var payload = JSON.parse(response.payload);
            Code.expect(response.statusCode).to.equal(200);
            Code.expect(payload.data).to.include('id', 'type', 'attributes');
            done();
        });
    });

    lab.test('logout', function (done) {

        var options = {
            method: 'POST', url: '/api/v1/logout'
        };
        authInject(server, options, resetAuthHeader, function (response) {

            Code.expect(response.statusCode).to.equal(204);
            Code.expect(response.payload).to.be.empty();
            done();
        });
    });

    lab.test('logged out', function (done) {

        var options = {
            method: 'GET', url: '/api/v1/me'
        };
        authInject(server, options, resetAuthHeader, function (response) {

            Code.expect(response.statusCode).to.equal(401);
            done();
        });
    });

    lab.test('log in with reset password', function (done) {

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
                        password: fixtures.users.reset.password
                    }
                }
            }
        };
        server.inject(options, function (response) {

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

    lab.test('me with reset logged in auth', function (done) {

        var options = {
            method: 'GET', url: '/api/v1/me'
        };
        authInject(server, options, userAuthHeader, function (response) {

            var payload = JSON.parse(response.payload);
            Code.expect(response.statusCode).to.equal(200);
            Code.expect(payload.data).to.include('id', 'type', 'attributes');
            done();
        });
    });
});
