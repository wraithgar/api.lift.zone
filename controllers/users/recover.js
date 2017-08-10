'use strict';

const Joi = require('joi');
const AWS = require('../../lib/aws');
const Config = require('getconfig');

module.exports = {
  description: 'Request password recovery',
  tags: ['api', 'user'],
  handler: async function (request, reply) {

    /* there is no condition under which we will do anything but this reply
     * so just send it now and do the rest asynchronously
     */
    reply(null).code(202);

    const existingRecovery = await this.db.recoveries.fresh(request.payload);

    if (existingRecovery) {
      return;
    }

    const user = await this.db.users.findOne({ email: request.payload.email, validated: true });

    if (!user) {
      return;
    }
    const recovery = await this.db.tx(async (tx) => {

      await tx.recoveries.destroy({ email: request.payload.email });
      return tx.recoveries.insert(request.payload);
    });

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
      try {
        AWS.sendEmail(email);
      }
      catch (err) {
        request.log(['error', 'user', 'recovery'], err.stack || err);
      }
    }
    // $lab:coverage:on$
    request.log(['debug'], recovery.token);
  },
  validate: {
    payload: {
      email: Joi.string().email().required()
    }
  },
  auth: false
};
