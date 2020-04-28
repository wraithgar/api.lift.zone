'use strict'

const AWS = require('../../lib/aws')
const Config = require('getconfig')

module.exports = {
  description: 'Request email validation',
  tags: ['api', 'user'],
  handler: async function (request, h) {
    const existingValidation = await this.db.validations.fresh({
      user_id: request.auth.credentials.id
    })

    if (existingValidation) {
      return h.response(null).code(202)
    }

    const validation = await this.db.validations.insert({
      user_id: request.auth.credentials.id
    })

    const email = {
      Destination: {
        ToAddresses: [request.auth.credentials.email]
      },
      Message: {
        Body: {
          Text: {
            Data: `Here is the link to validate your lift.zone account: ${Config.clientUri}/validate?token=${validation.token}\n\nOnce validate you will be able to send invites and recover your password should you lose it.\n\nThis link expires in 15 minutes.`
          },
          Html: {
            Data: `<a href="${Config.clientUri}/validate?token=${validation.token}">Here</a> is the link you requested to recover your lift.zone password.<br /><br />Once validate you will be able to send invites and recover your password should you lose it.<br /><br />This link expires in 15 minutes.`
          }
        },
        Subject: {
          Data: 'Lift zone account validation'
        }
      },
      Source: Config.email.from,
      ReplyToAddresses: [Config.email.from]
    }

    // $lab:coverage:off$
    if (process.env.NODE_ENV) {
      try {
        AWS.sendEmail(email)
      } catch (err) {
        request.log(['error', 'user', 'validate'], err.stack || err)
      }
    }

    // $lab:coverage:on$
    request.log(['debug'], validation.token)

    return h.response(null).code(202)
  }
}
