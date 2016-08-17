'use strict';


module.exports = {
  description: 'Get all users',
  tags: ['admin'],
  handler: function (request, reply) {

    const result = this.db.users.summary();

    return reply(result);
  },
  auth: {
    scope: 'admin'
  }
};
