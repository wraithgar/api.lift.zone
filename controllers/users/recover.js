'use strict';

const Joi = require('joi');

module.exports = {
  description: 'Request password recovery',
  tags: ['user'],
  handler: function (request, reply) {

    /* there is no condition under which we will do anything but this reply
     * so just send it now and do the rest asynchronously
     */
    reply(null).code(202);

    this.db.recoveries.fresh(request.payload).then((existingRecovery) => {

      if (existingRecovery) {
        return;
      }

      this.db.tx((tx) => {

        return tx.recoveries.destroy({ email: request.payload.email }).then(() => {

          return tx.recoveries.insert(request.payload);
        });
      }).then(() => {
        //TODO .then send email
      }).catch((err) => {

        //$lab:coverage:off$
        request.log(['error', 'user', 'recovery'], err);
        //$lab:coverage:on$
      });
    });
  },
  validate: {
    payload: {
      email: Joi.string().email().required()
    }
  },
  auth: false
};
