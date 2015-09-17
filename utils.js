'use strict';
const Boom = require('boom');
const Config = require('getconfig');
const Crypto = require('crypto');
const Nodemailer = require('nodemailer');
const Jwt = require('jsonwebtoken');
const Uuid = require('uuid');
const Bluebird = require('bluebird');
const NodemailerPromised = Bluebird.promisifyAll(Nodemailer);

const transporter = Nodemailer.createTransport({ ignoreTLS: true, debug: true });

exports.transporter = transporter;

exports.transportLog = function (logger) {

    transporter.on('log', function (info) {

        logger(['info', 'nodemailer'], info);
    });
};

exports.userToken = function (user) {

    const token = {
        entity: 'user',
        user: {
            id: user.get('id'),
            supertoken: user.get('supertoken')
        }
    };
    return Jwt.sign(token, Config.jwt.privateKey);
};

exports.passwordHash = function (password) {

    const salt = Config.passwordSalt;
    return Crypto.createHash('sha1').update(salt + password).digest('hex');
};

//For now these all do the same thing but are distinct functions in the event we want them to do different things
exports.generateInviteCode = function () {

    const token = Uuid.v4();
    return token;
};

exports.generateValidationCode = function () {

    const token = Uuid.v4();
    return token;
};

exports.generateRecoveryCode = function () {

    const token = Uuid.v4();
    return token;
};

exports.generateSupertoken = function () {

    return Date.now().toString();
};

exports.jwtValidate = function (db) {

    const checkUser = function (request, decodedToken, callback) {

        const userId = decodedToken.user.id;
        const supertoken = decodedToken.user.supertoken;
        if (!userId || !supertoken) {

            return callback(Boom.unauthorized('Invalid token'), false, null);
        }

        return db.User.forge({ id: userId }).fetch().then(function (user) {

            if (!user) {
                throw Boom.unauthorized('Invalid user');
            }
            if (user.get('supertoken') !== supertoken) {
                throw Boom.unauthorized('Stale token');
            }

            return user;
        }).then(function (user) {

            const credentials = {
                user: user
            };

            return callback(null, true, credentials);
        }).catch(function (err) {

            return callback(err, false, null);
        });
    };
    return checkUser;
};

exports.mailValidation = function (email, validation) {

    const mailOptions = {
        from: Config.serverMail,
        to: email,
        subject: 'Lift Zone email validation',
        text: 'Go here to validate your lift.zone account email: http://lift.zone/validate?code=' + validation.get('code')
    };

    return transporter.sendMail(mailOptions);
};

exports.mailRecovery = function (email, login, recovery) {

    const mailOptions = {
        from: Config.serverMail,
        to: email,
        subject: 'Lift zone password recovery',
        text: 'Sorry you forgot your password.  Don\`t worry, it happens to the best of us.\nClick this hyperlink and you can reset your password http://lift.zone/recover?code=' + recovery.get('code') + '\nYour login, in case you forgot that too, is' + login + '.\n\np.s. If you didn\'t request a password recovery disregard this email, nothing on your account will change.'
    };

    return transporter.sendMail(mailOptions);
};
