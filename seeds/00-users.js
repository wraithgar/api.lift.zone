/*eslint camelcase:0*/
var utils = require('../utils');

exports.seed = function (knex) {

    return knex.table('users').first('id').where({login: 'admin'}).then(function (user) {

        if (user === undefined) {
            user = knex('users').insert({
                login: 'admin',
                password_hash: utils.passwordHash('changeme'),
                supertoken: utils.generateSupertoken(),
                name: 'Admin',
                email: 'admin@lift.zone',
                active: true,
                validated: true,
                smartmode: true
            });
        }

        return user;
    });
};
