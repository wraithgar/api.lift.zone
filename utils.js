'use strict';

var crypto = require('crypto');
var uuid = require('uuid');
var config = require('getconfig');
var jwt = require('jsonwebtoken');
var Boom = require('boom');

exports.userToken = function (user) {

    var token = {
        entity: 'user',
        user: {
            id: user.get('id'),
            supertoken: user.get('supertoken')
        }
    };
    return jwt.sign(token, config.jwt.privateKey);
};

exports.passwordHash = function (password) {

    var salt = config.passwordSalt;
    return crypto.createHash('sha1').update(salt + password).digest('hex');
};

//For now these all do the same thing but are distinct functions in the event we want them to do different things
exports.generateInviteCode = function () {

    var token = uuid.v4();
    return token;
};

exports.generateValidationCode = function () {

    var token = uuid.v4();
    return token;
};

exports.generateRecoveryCode = function () {

    var token = uuid.v4();
    return token;
};

exports.generateSupertoken = function () {

    return Date.now().toString();
};

exports.jwtValidate = function (db) {

    var checkUser = function (decodedToken, callback) {

        var userId = decodedToken.user.id;
        var supertoken = decodedToken.user.supertoken;
        if (!userId || !supertoken) {

            return callback(Boom.unauthorized('Invalid token'), false, null);
        }

        return db.User.forge({id: userId}).fetch({withRelated: 'invites'}).then(function (user) {

            if (!user) {

                throw Boom.unauthorized('Invalid user');
            }
            if (user.get('supertoken') !== supertoken) {

                throw Boom.unauthorized('Stale token');
            }

            return user;
        }).then(function (user) {

            var credentials = {
                user: user
            };

            return callback(null, true, credentials);
        }).catch(function (err) {

            return callback(err, false, null);
        });
    };
    return checkUser;
};
