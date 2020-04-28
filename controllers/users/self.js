'use strict'

module.exports = {
  description: 'Currently logged in user',
  tags: ['api', 'user'],
  handler: function (request) {
    const user = request.auth.credentials

    return user
  }
}
