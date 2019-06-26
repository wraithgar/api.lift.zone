'use strict';

const Config = require('getconfig');
const Faker = require('faker');
const Bcrypt = require('bcrypt');
const Moment = require('moment');

module.exports.Server = require('../server').server;
module.exports.db = require('../server').db;

module.exports.expect = require('@hapi/code').expect;

const build = (defaults, attrs, id) => {
  const record = Object.assign(defaults, attrs);
  if (record.created_at && !record.updated_at) {
    record.updated_at = record.created_at;
  }
  if (record.password) {
    const salt = Bcrypt.genSaltSync(Config.saltRounds);
    record.hash = Bcrypt.hashSync(record.password, salt);
  }
  if (id) {
    record.id = Faker.random.uuid();
  }
  return record;
};

module.exports.uuid = () => {
  return Faker.random.uuid();
};
module.exports.user = attrs => {
  const defaults = {
    id: Faker.random.uuid(),
    name: Faker.name.findName(),
    email: Faker.internet.email(),
    validated: true,
    password: Faker.internet.password()
  };

  return build(defaults, attrs);
};

module.exports.recovery = attrs => {
  const defaults = {
    token: Faker.random.uuid()
  };

  return build(defaults, attrs);
};

module.exports.validation = attrs => {
  const defaults = {
    token: Faker.random.uuid()
  };

  return build(defaults, attrs);
};

module.exports.invite = attrs => {
  const defaults = {
    token: Faker.random.uuid()
  };

  return build(defaults, attrs);
};

module.exports.activity = (attrs, id) => {
  const defaults = {
    name: Faker.random.words(3)
  };

  return build(defaults, attrs, id);
};

module.exports.workout = (attrs, id, dates) => {
  const defaults = {
    name: Faker.random.words(),
    raw: Faker.lorem.paragraphs(),
    date: Moment(Faker.date.past()).format('YYYY-MM-DD'),
    activities: []
  };

  if (dates) {
    while (
      dates.some(date => {
        return defaults.date === date;
      })
    ) {
      defaults.date = Moment(Faker.date.past()).format('YYYY-MM-DD');
    }
  }

  return build(defaults, attrs, id);
};
