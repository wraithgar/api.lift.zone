'use strict';
process.env.NODE_ENV = 'test';

const Code = require('code');
const Hoek = require('hoek');
const Lab = require('lab');

const Fixtures = require('./fixtures');
const DbHelper = require('./db-helper');
const AuthInject = require('./auth-inject');
const serverItems = require('../').getServer();

const lab = exports.lab = Lab.script();

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

//server.on('request-error', function (request, error) {

    //console.log(error.stack);
//});

lab.experiment('signup and validate', function () {

    let authUser;
    let userAuthHeader;
    let inviteCode;
    let validateCode;

    lab.before(function (done) {

        Utils.transporter.sendMail = sendMail;
        return dbHelper.rollbackAll().then(function () {

            return dbHelper.migrateLatest();
        }).then(function () {

            return dbHelper.createUser(Fixtures.users.main, { count: 5 });
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

    lab.test('get invites', function (done) {

        const options = {
            method: 'GET', url: '/api/v1/me/invites'
        };
        AuthInject(server, options, userAuthHeader, function (response) {

            const payload = JSON.parse(response.payload);
            Code.expect(response.statusCode).to.equal(200);
            Code.expect(payload.data).to.have.length(5);
            inviteCode = payload.data[0];
            done();
        });
    });

    lab.experiment('signup using invite', function () {

        let signupUser;
        let signupUserAuthHeader;

        lab.experiment('invite validity', function () {

            lab.test('valid invite', function (done) {

                const options = {
                    method: 'GET', url: '/api/v1/invite/' + inviteCode.attributes.code,
                    headers: {
                        accept: 'application/vnd.api+json',
                        'content-type': 'application/vnd.api+json'
                    }
                };
                server.inject(options, function (response) {

                    Code.expect(response.statusCode).to.equal(200);
                    done();
                });
            });

            lab.test('invalid invite', function (done) {

                const options = {
                    method: 'GET', url: '/api/v1/invite/' + Utils.generateInviteCode(),
                    headers: {
                        accept: 'application/vnd.api+json',
                        'content-type': 'application/vnd.api+json'
                    }
                };
                server.inject(options, function (response) {

                    Code.expect(response.statusCode).to.equal(404);
                    done();
                });
            });
        });
        lab.experiment('login availability', function () {

            lab.test('invalid invite', function (done) {

                const options = {
                    method: 'POST', url: '/api/v1/taken',
                    headers: {
                        accept: 'application/vnd.api+json',
                        'content-type': 'application/vnd.api+json'
                    },
                    payload: {
                        data: {
                            type: 'taken',
                            id: 'taken',
                            attributes: {
                                invite: Utils.generateInviteCode(),
                                login: Fixtures.users.main.login
                            }
                        }
                    }
                };
                server.inject(options, function (response) {

                    Code.expect(response.statusCode).to.equal(404);
                    done();
                });
            });

            lab.test('login taken', function (done) {

                const options = {
                    method: 'POST', url: '/api/v1/taken',
                    headers: {
                        accept: 'application/vnd.api+json',
                        'content-type': 'application/vnd.api+json'
                    },
                    payload: {
                        data: {
                            type: 'taken',
                            id: 'taken',
                            attributes: {
                                invite: inviteCode.attributes.code,
                                login: Fixtures.users.main.login
                            }
                        }
                    }
                };
                server.inject(options, function (response) {

                    const payload = JSON.parse(response.payload);
                    Code.expect(response.statusCode).to.equal(200);
                    Code.expect(payload.data).to.include('id', 'type', 'attributes');
                    Code.expect(payload.data.type).to.equal('taken');
                    Code.expect(payload.data.attributes.taken).to.equal(true);
                    done();
                });
            });

            lab.test('login available', function (done) {

                const options = {
                    method: 'POST', url: '/api/v1/taken',
                    headers: {
                        accept: 'application/vnd.api+json',
                        'content-type': 'application/vnd.api+json'
                    },
                    payload: {
                        data: {
                            type: 'taken',
                            id: 'taken',
                            attributes: {
                                invite: inviteCode.attributes.code,
                                login: Fixtures.users.nonexistant.login
                            }
                        }
                    }
                };
                server.inject(options, function (response) {

                    const payload = JSON.parse(response.payload);
                    Code.expect(response.statusCode).to.equal(200);
                    Code.expect(payload.data).to.include('id', 'type', 'attributes');
                    Code.expect(payload.data.type).to.equal('taken');
                    Code.expect(payload.data.attributes.taken).to.equal(false);
                    done();
                });
            });
        });

        lab.test('sign up login taken', function (done) {

            const invite = Hoek.applyToDefaults(Fixtures.users.signup, { invite: inviteCode.attributes.code, passwordConfirm: Fixtures.users.signup.password });
            invite.login = Fixtures.users.main.login;

            const options = {
                method: 'POST', url: '/api/v1/signup',
                headers: {
                    accept: 'application/vnd.api+json',
                    'content-type': 'application/vnd.api+json'
                },
                payload: {
                    data: {
                        type: 'signup',
                        attributes: invite
                    }
                }
            };
            server.inject(options, function (response) {

                const payload = JSON.parse(response.payload);
                Code.expect(response.statusCode).to.equal(409);
                done();
            });
        });

        lab.test('sign up', function (done) {

            const invite = Hoek.applyToDefaults(Fixtures.users.signup, { invite: inviteCode.attributes.code, passwordConfirm: Fixtures.users.signup.password });
            const options = {
                method: 'POST', url: '/api/v1/signup',
                headers: {
                    accept: 'application/vnd.api+json',
                    'content-type': 'application/vnd.api+json'
                },
                payload: {
                    data: {
                        type: 'signup',
                        attributes: invite
                    }
                }
            };
            server.inject(options, function (response) {

                const payload = JSON.parse(response.payload);
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

            const options = {
                method: 'GET', url: '/api/v1/me/invites'
            };
            AuthInject(server, options, userAuthHeader, function (response) {

                const payload = JSON.parse(response.payload);
                Code.expect(response.statusCode).to.equal(200);
                Code.expect(payload.data).to.have.length(4);
                done();
            });
        });

        lab.test('reuse signup token', function (done) {

            const invite = Hoek.applyToDefaults(Fixtures.users.signup, { invite: inviteCode.attributes.code, passwordConfirm: Fixtures.users.signup.password });
            const options = {
                method: 'POST', url: '/api/v1/signup',
                headers: {
                    accept: 'application/vnd.api+json',
                    'content-type': 'application/vnd.api+json'
                },
                payload: {
                    data: {
                        type: 'signup',
                        attributes: invite
                    }
                }
            };
            server.inject(options, function (response) {

                const payload = JSON.parse(response.payload);
                Code.expect(response.statusCode).to.equal(404);
                done();
            });
        });

        lab.test('signup user not validated', function (done) {

            const options = {
                method: 'GET', url: '/api/v1/me'
            };
            AuthInject(server, options, signupUserAuthHeader, function (response) {

                const payload = JSON.parse(response.payload);
                Code.expect(response.statusCode).to.equal(200);
                Code.expect(payload.data).to.include('id', 'type', 'attributes');
                Code.expect(payload.data.attributes.validated).to.equal(false);
                done();
            });
        });

        lab.test('no invites for non validated user', function (done) {

            const options = {
                method: 'GET', url: '/api/v1/me/invites'
            };
            AuthInject(server, options, signupUserAuthHeader, function (response) {

                const payload = JSON.parse(response.payload);
                Code.expect(response.statusCode).to.equal(404);
                Code.expect(payload.data).to.equal(undefined);
                done();
            });
        });

        lab.test('nonexistant validation confirm validation', function (done) {

            const options = {
                'method': 'POST', url: '/api/v1/me/confirm',
                payload: {
                    data: {
                        id: Utils.generateValidationCode(),
                        type: 'validation'
                    }
                }
            };
            AuthInject(server, options, signupUserAuthHeader, function (response) {

                Code.expect(response.statusCode).to.equal(404);
                done();
            });
        });

        lab.test('request validation', function (done) {

            const options = {
                method: 'POST', url: '/api/v1/validate'
            };
            AuthInject(server, options, signupUserAuthHeader, function (response) {

                const payload = JSON.parse(response.payload);
                Code.expect(response.statusCode).to.equal(202);
                Code.expect(payload.data).to.equal(null);
                Code.expect(mailLog[Fixtures.users.signup.email]).to.have.length(1);
                validateCode = mailLog[Fixtures.users.signup.email][0].text.split('code=')[1];
                done();
            });
        });

        lab.test('re-request validation', function (done) {

            const options = {
                method: 'POST', url: '/api/v1/validate'
            };
            AuthInject(server, options, signupUserAuthHeader, function (response) {

                const payload = JSON.parse(response.payload);
                Code.expect(response.statusCode).to.equal(202);
                Code.expect(payload.data).to.equal(null);
                Code.expect(mailLog[Fixtures.users.signup.email]).to.have.length(1);
                done();
            });
        });

        lab.test('invalid confirm validation', function (done) {

            const options = {
                'method': 'POST', url: '/api/v1/me/confirm',
                payload: {
                    data: {
                        id: Utils.generateValidationCode(),
                        type: 'validation'
                    }
                }
            };
            AuthInject(server, options, signupUserAuthHeader, function (response) {

                Code.expect(response.statusCode).to.equal(404);
                done();
            });
        });

        lab.test('confirm validation', function (done) {

            const options = {
                'method': 'POST', url: '/api/v1/me/confirm',
                payload: {
                    data: {
                        id: validateCode,
                        type: 'validation'
                    }
                }
            };
            AuthInject(server, options, signupUserAuthHeader, function (response) {

                const payload = JSON.parse(response.payload);
                Code.expect(response.statusCode).to.equal(200);
                Code.expect(payload.data).to.equal(null);
                done();
            });

        });

        lab.test('re-confirm validation', function (done) {

            const options = {
                'method': 'POST', url: '/api/v1/me/confirm',
                payload: {
                    data: {
                        id: validateCode,
                        type: 'validation'
                    }
                }
            };
            AuthInject(server, options, signupUserAuthHeader, function (response) {

                const payload = JSON.parse(response.payload);
                Code.expect(response.statusCode).to.equal(200);
                Code.expect(payload.data).to.equal(null);
                done();
            });

        });

        lab.test('user is validated', function (done) {

            const options = {
                method: 'GET', url: '/api/v1/me'
            };
            AuthInject(server, options, signupUserAuthHeader, function (response) {

                const payload = JSON.parse(response.payload);
                Code.expect(response.statusCode).to.equal(200);
                Code.expect(payload.data).to.include('id', 'type', 'attributes');
                Code.expect(payload.data.attributes.validated).to.equal(true);
                done();
            });
        });

        lab.test('request superfluous validation', function (done) {

            const options = {
                method: 'POST', url: '/api/v1/validate'
            };
            AuthInject(server, options, signupUserAuthHeader, function (response) {

                const payload = JSON.parse(response.payload);
                Code.expect(response.statusCode).to.equal(202);
                Code.expect(payload.data).to.equal(null);
                Code.expect(mailLog[Fixtures.users.signup.email]).to.have.length(1);
                done();
            });
        });

        lab.test('validated user has invites', function (done) {

            const options = {
                method: 'GET', url: '/api/v1/me/invites'
            };
            AuthInject(server, options, signupUserAuthHeader, function (response) {

                const payload = JSON.parse(response.payload);
                Code.expect(response.statusCode).to.equal(200);
                Code.expect(payload.data).to.have.length(5);
                inviteCode = payload.data[0];
                done();
            });
        });
    });
});
