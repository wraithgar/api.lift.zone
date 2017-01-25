'use strict';

const Fixtures = require('../fixtures');
const Faker = require('faker');
const StandIn = require('stand-in');
const AWS = require('../../lib/aws');

const db = Fixtures.db;
const Server = Fixtures.server;

const lab = exports.lab = require('lab').script();
const expect = require('code').expect;

const before = lab.before;
const after = lab.after;
const afterEach = lab.afterEach;
const describe = lab.describe;
const it = lab.it;

describe('POST /user/recover', () => {

  let server;
  const user1 = Fixtures.user({ logout: Faker.date.past() });
  const user2 = Fixtures.user({ logout: Faker.date.past(), validated: false });
  before(() => {

    return Promise.all([
      Server,
      db.users.insert(user1),
      db.users.insert(user2)
    ]).then((items) => {

      server = items[0];
    });
  });

  afterEach(() => {

    return db.recoveries.destroy({ email: user1.email });
  });

  after(() => {

    return Promise.all([
      db.users.destroy({ id: user1.id }),
      db.users.destroy({ id: user2.id })
    ]);
  });

  it('creates a recovery', (done) => {

    let sesParams;
    StandIn.replace(AWS, 'sendEmail', (stand, params) => {

      stand.restore();
      sesParams = params;
    });

    server.inject({ method: 'post', url: '/user/recover', payload: { email: user1.email } }).then((res) => {

      //Wait for promises to fire asynchronously
      setTimeout(() => {

        expect(res.statusCode).to.equal(202);
        expect(res.result).to.equal(null);
        db.recoveries.findOne({ email: user1.email }).then((recovery) => {

          expect(recovery).to.exist();
          expect(sesParams.Destination.ToAddresses).to.include(user1.email);
          expect(sesParams.Message.Body.Text.Data).to.include(recovery.token);
          done();
        });
      }, 50);
    });
  });

  it('ignores invalid email', (done) => {

    const email = Faker.internet.email();
    server.inject({ method: 'post', url: '/user/recover', payload: { email } }).then((res) => {

      //Wait for promises to fire asynchronously
      setTimeout(() => {

        expect(res.statusCode).to.equal(202);
        expect(res.result).to.equal(null);
        db.recoveries.findOne({ email }).then((recovery) => {

          expect(recovery).to.not.exist();
          done();
        });
      }, 50);
    });
  });

  it('ignores non validated user', (done) => {

    server.inject({ method: 'post', url: '/user/recover', payload: { email: user2.email } }).then((res) => {

      //Wait for promises to fire asynchronously
      setTimeout(() => {

        expect(res.statusCode).to.equal(202);
        expect(res.result).to.equal(null);
        db.recoveries.findOne({ email: user2.email }).then((recovery) => {

          expect(recovery).to.not.exist();
          done();
        });
      }, 50);
    });
  });

  describe('with existing recovery', () => {

    const recovery = Fixtures.recovery({ email: user1.email });
    before(() => {

      return db.recoveries.insert(recovery);
    });

    it('does nothing', (done) => {

      server.inject({ method: 'post', url: '/user/recover', payload: { email: user1.email } }).then((res) => {

        //Wait for promises to fire asynchronously
        setTimeout(() => {

          expect(res.statusCode).to.equal(202);
          expect(res.result).to.equal(null);
          db.recoveries.findOne({ email: user1.email }).then((existingRecovery) => {

            expect(existingRecovery).to.include(recovery);
            done();
          });
        }, 50);
      });
    });
  });
});
