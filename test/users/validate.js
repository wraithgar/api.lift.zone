'use strict';

const Server = require('../../server');
const Fixtures = require('../fixtures');
const StandIn = require('stand-in');
const AWS = require('../../lib/aws');

const db = Fixtures.db;

const lab = exports.lab = require('lab').script();
const expect = require('code').expect;

const before = lab.before;
const after = lab.after;
const describe = lab.describe;
const it = lab.it;

describe('POST /user/validate', () => {

  let server;
  const user1 = Fixtures.user({ validated: false });
  const user2 = Fixtures.user({ validated: false });
  const validation2 = Fixtures.validation({ user_id: user2.id });

  before(() => {

    return Promise.all([
      Server,
      db.users.insert(user1),
      db.users.insert(user2)
    ]).then((items) => {

      server = items[0];
      return Promise.all([
        db.validations.insert(validation2)
      ]);
    });
  });

  after(() => {

    return Promise.all([
      db.users.destroy({ id: user1.id }),
      db.users.destroy({ id: user2.id })
    ]);
  });

  it('requests validation', () => {

    let sesParams;
    StandIn.replace(AWS, 'sendEmail', (stand, params) => {

      stand.restore();
      sesParams = params;
    });

    return server.inject({ method: 'post', url: '/user/validate', credentials: user1 }).then((res) => {

      expect(res.statusCode).to.equal(202);
      return db.validations.findOne({ user_id: user1.id });
    }).then((createdValidation) => {

      expect(createdValidation).to.exist();
      expect(sesParams.Destination.ToAddresses).to.include(user1.email);
      expect(sesParams.Message.Body.Text.Data).to.include(createdValidation.token);
    });
  });

  it('ignores if validation exists', () => {

    return server.inject({ method: 'post', url: '/user/validate', credentials: user2 }).then((res) => {

      expect(res.statusCode).to.equal(202);
      return db.validations.findOne({ user_id: user2.id });
    }).then((createdValidation) => {

      expect(createdValidation).to.include(validation2);
    });
  });
});
