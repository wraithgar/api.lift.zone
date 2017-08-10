'use strict';

const Boom = require('boom');

module.exports = {
  description: 'Heartbeat',
  handler: async function (request, reply) {

    const count = await this.db.users.count();

    //$lab:coverage:off$
    if (count.count > -1) {
      return reply('ok').type('text/plain');
    }

    throw Boom.internal('Heartbeat error');
    //$lab:coverage:on$
  },
  auth: false
};
