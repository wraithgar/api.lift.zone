'use strict';

const Joi = require('joi');
const AWS = require('../../lib/aws');
const Config = require('getconfig');

module.exports = {
  description: 'Request password recovery',
  tags: ['api', 'user'],
  handler: async function (request, reply) {

    const existingRecovery = await this.db.recoveries.fresh(request.payload);

    if (existingRecovery) {
      return reply(null).code(202);
    }

    const user = await this.db.users.findOne({ email: request.payload.email, validated: true });

    if (!user) {
      return reply(null).code(202);
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

    //We used to return instantly but since changing to async/await that broke
    //but it works if we reply at the end and I can't be bothered to
    //figure out why
    reply(null).code(202);
  },
  validate: {
    payload: {
      email: Joi.string().email().required()
    }
  },
  auth: false
};
