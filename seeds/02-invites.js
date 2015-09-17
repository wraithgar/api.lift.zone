/*eslint camelcase:0*/
'use strict';
const Utils = require('../utils');

exports.seed = function (knex, Promise) {

    return knex.table('users').first('id').where({ login: 'admin' }).then(function (user) {

        if (user === undefined) {
            throw new Error('Admin user missing');
        }

        return Promise.join(
            knex('invites').del(),
            knex('invites').insert({ user_id: user.id, code: Utils.generateInviteCode() }),
            knex('invites').insert({ user_id: user.id, code: Utils.generateInviteCode() }),
            knex('invites').insert({ user_id: user.id, code: Utils.generateInviteCode() }),
            knex('invites').insert({ user_id: user.id, code: Utils.generateInviteCode() }),
            knex('invites').insert({ user_id: user.id, code: Utils.generateInviteCode() })
        );
    });
};
