'use strict';

const Bcrypt = require('bcrypt');
const Config = require('getconfig');
const Joi = require('joi');

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

exports.workoutValidator = Joi.object({
  id: Joi.string().guid().strip(),
  name: Joi.string().required(),
  date: Joi.date().format('YYYY-MM-DD').raw(),
  raw: Joi.string().required(),
  visible: Joi.boolean(),
  activities: Joi.array().items(Joi.object({
    id: Joi.string().guid().required(),
    activity_id: Joi.string().guid().allow(null),
    name: Joi.string(),
    alias: Joi.string().allow(null),
    comment: Joi.string(),
    sets: Joi.array().items(Joi.object().keys({
      pr: Joi.boolean(),
      reps: Joi.number(),
      weight: Joi.number(),
      unit: Joi.string().allow('miles', 'kilometers', 'kg', 'lb'),
      time: Joi.number(),
      distance: Joi.number()
    }).nand('weight', 'time').with('weight', ['reps', 'unit']).with('distance', 'unit').xor('reps', 'time')),
    suggestions: Joi.any().strip()
  }))
});
