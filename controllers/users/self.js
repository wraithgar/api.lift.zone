'use strict';

module.exports = {
  description: 'Currently logged in user',
  tags: ['api', 'user'],
  handler: function (request, reply) {

    const user = request.auth.credentials;

    reply(user);
  }
};
