var Boom = require('boom');
var Config = require('getconfig');
var Crypto = require('crypto');
var Nodemailer = require('nodemailer');
var Jwt = require('jsonwebtoken');
var Uuid = require('uuid');

exports.userToken = function (user) {

    var token = {
        entity: 'user',
        user: {
            id: user.get('id'),
            supertoken: user.get('supertoken')
        }
    };
    return Jwt.sign(token, Config.jwt.privateKey);
};

exports.passwordHash = function (password) {

    var salt = Config.passwordSalt;
    return Crypto.createHash('sha1').update(salt + password).digest('hex');
};

//For now these all do the same thing but are distinct functions in the event we want them to do different things
exports.generateInviteCode = function () {

    var token = Uuid.v4();
    return token;
};

exports.generateValidationCode = function () {

    var token = Uuid.v4();
    return token;
};

exports.generateRecoveryCode = function () {

    var token = Uuid.v4();
    return token;
};

exports.generateSupertoken = function () {

    return Date.now().toString();
};

exports.jwtValidate = function (db) {

    var checkUser = function (request, decodedToken, callback) {

        var userId = decodedToken.user.id;
        var supertoken = decodedToken.user.supertoken;
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

exports.mailValidation = function (email, validation, BPromise) {

    var mailOptions = {
        from: Config.serverMail,
        to: email,
        subject: 'Lift Zone email validation',
        text: 'Go here to validate your lift.zone account email: http://lift.zone/validate?code=' + validation.get('code')
    };

    var transporter = Nodemailer.createTransport({ ignoreTLS: true });
    var sendMail = BPromise.promisify(transporter.sendMail.bind(this));

    return sendMail(mailOptions);
};

exports.mailRecovery = function (email, recovery) {

    var mailOptions = {
        from: Config.serverMail,
        to: email,
        subject: 'Lift zone password recovery',
        text: 'Sorry you forgot your password.  Don\`t worry, it happens to the best of us.\nClick this hyperlink and you can reset your password http://lift.zone/recover?code=' + recovery.get('code') + '\n\np.s. If you didn\'t request a password recovery disregard this email, nothing on your account will change.'
    };
    var transporter = Nodemailer.createTransport({ ignoreTLS: true });

    transporter.sendMail(mailOptions);
};
