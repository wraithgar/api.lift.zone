'use strict';

const Boom = require('boom');

module.exports = {
  description: 'Heartbeat',
  handler: function (request, reply) {

    const result = this.db.users.count().then((count) => {

      //$lab:coverage:off$
      if (count.count > 0) {
        return 'ok';
      }

      throw Boom.internal('Heartbeat error');
      //$lab:coverage:on$
    });

    return reply(result);
  },
  auth: false
};
