'use strict';

const Config = require('getconfig');
const Muckraker = require('muckraker');
const Faker = require('faker');
const Bcrypt = require('bcrypt');

const build = (defaults, attrs) => {

  const record = Object.assign(defaults, attrs);
  if (record.created_at && !record.updated_at) {
    record.updated_at = record.created_at;
  }
  if (record.password) {
    const salt = Bcrypt.genSaltSync(Config.saltRounds);
    defaults.hash = Bcrypt.hashSync(record.password, salt);
  }
  return record;
};

module.exports.db = new Muckraker(Config.db);

module.exports.user = (attrs) => {

  const defaults = {
    id: Faker.random.uuid(),
    name: Faker.name.findName(),
    email: Faker.internet.email(),
    validated: true,
    password: Faker.internet.password()
  };

  return build(defaults, attrs);
};

module.exports.recovery = (attrs) => {

  const defaults = {
    token: Faker.random.uuid(),
    email: Faker.internet.email()
  };

  return build(defaults, attrs);
};

module.exports.validation = (attrs) => {

  const defaults = {
    token: Faker.random.uuid(),
    user_id: Faker.random.uuid()
  };

  return build(defaults, attrs);
};

module.exports.invite = (attrs) => {

  const defaults = {
    token: Faker.random.uuid(),
    user_id: Faker.random.uuid()
  };

  return build(defaults, attrs);
};
