'use strict';

const Boom = require('@hapi/boom');

module.exports = {
  description: 'Heartbeat',
  handler: async function(request, h) {
    const count = await this.db.users.count();

    //$lab:coverage:off$
    if (count.count > -1) {
      return h.response('ok').type('text/plain');
    }

    throw Boom.internal('Heartbeat error');
    //$lab:coverage:on$
  },
  auth: false
};
