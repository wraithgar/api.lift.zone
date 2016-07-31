'use strict';

const Bcrypt = require('bcrypt');
const Config = require('getconfig');

exports.bcryptCompare = function (password, user) {

  return new Promise((resolve, reject) => {

    Bcrypt.compare(password, user.hash, (err, res) => {

      //$lab:coverage:off$
      if (err) {
        return reject(err);
      }
      //$lab:coverage:off$

      if (res) {
        return resolve(user);
      }

      return resolve();
    });
  });
};

exports.bcryptHash = function (string) {

  return new Promise((resolve, reject) => {

    Bcrypt.genSalt(Config.saltRounds, (err, salt) => {

      //$lab:coverage:off$
      if (err) {
        return reject(err);
      }
      //$lab:coverage:off$

      Bcrypt.hash(string, salt, (err, hash) => {

        //$lab:coverage:off$
        if (err) {
          return reject(err);
        }
        //$lab:coverage:on$

        return resolve(hash);
      });
    });
  });
};
