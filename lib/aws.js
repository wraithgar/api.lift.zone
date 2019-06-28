'use strict';

/* Isolated aws send function in an attempt to separate things for easier testing */

const AWS = require('aws-sdk');
const Config = require('getconfig');
const SES = new AWS.SES(Config.aws.ses);

//$lab:coverage:off$
module.exports = {
  sendEmail: function(params) {
    return new Promise((resolve, reject) => {
      if (process.env.NODE_ENV === 'test') {
        return reject('test environment');
      }
      SES.sendEmail(params, (err, data) => {
        if (err) {
          return reject(err);
        }

        return resolve(data);
      });
    });
  }
};
//$lab:coverage:on$
