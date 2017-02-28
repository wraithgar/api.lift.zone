'use strict';

const Joi = require('joi');
const AWS = require('../../lib/aws');
const Config = require('getconfig');

module.exports = {
  description: 'Request password recovery',
  tags: ['api', 'user'],
  handler: function (request, reply) {

    /* there is no condition under which we will do anything but this reply
     * so just send it now and do the rest asynchronously
     */
    reply(null).code(202);

    this.db.recoveries.fresh(request.payload).then((existingRecovery) => {

      if (existingRecovery) {
        return;
      }

      return this.db.users.findOne({ email: request.payload.email, validated: true }).then((user) => {

        if (!user) {
          return;
        }
        return this.db.tx((tx) => {

          return tx.recoveries.destroy({ email: request.payload.email }).then(() => {

            return tx.recoveries.insert(request.payload);
          });
        }).then((recovery) => {

          const email = {
            Destination: {
              ToAddresses: [
                recovery.email
              ]
            },
            Message: {
              Body: {
                Text: {
                  Data: `Here is the link you requested to recover your lift.zone password: ${Config.clientUri}/recover?token=${recovery.token}\n\nIf you did not request this, simply don't click this link.\n\nThis link expires in 3 hours.`
                },
                Html: {
                  Data: `<a href="${Config.clientUri}/recover?token=${recovery.token}">Here</a> is the link you requested to recover your lift.zone password.<br /><br />If you did not request this, simply don't click this link.<br /><br />This link expires in 3 hours.`
                }
              },
              Subject: {
                Data: 'Lift zone password recovery'
              }
            },
            Source: Config.email.from,
            ReplyToAddresses: [
              Config.email.from
            ]
          };

          // $lab:coverage:off$
          if (process.env.NODE_ENV) {
            return AWS.sendEmail(email);
          }
          request.log(['debug'], recovery.token);
          // $lab:coverage:on$
        });
      });
    }).catch((err) => {

      //$lab:coverage:off$
      request.log(['error', 'user', 'recovery'], err.stack || err);
      //$lab:coverage:on$
    });
  },
  validate: {
    payload: {
      email: Joi.string().email().required()
    }
  },
  auth: false
};
