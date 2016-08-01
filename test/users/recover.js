'use strict';

const Server = require('../../server');
const Fixtures = require('../fixtures');
const Faker = require('faker');

const db = Fixtures.db;

const lab = exports.lab = require('lab').script();
const expect = require('code').expect;

const before = lab.before;
const after = lab.after;
const afterEach = lab.afterEach;
const describe = lab.describe;
const it = lab.it;

describe('POST /user/recover', () => {

  let server;
  const user = Fixtures.user({ logout: Faker.date.past() });
  before(() => {

    return Promise.all([
      Server,
      db.users.insert(user)
    ]).then((items) => {

      server = items[0];
    });
  });

  afterEach(() => {

    return db.recoveries.destroy({ email: user.email });
  });

  after(() => {

    return db.users.destroy({ id: user.id });
  });

  it('creates a recovery', (done) => {

    server.inject({ method: 'post', url: '/user/recover', payload: { email: user.email } }).then((res) => {

      //Wait for promises to fire asynchronously
      setTimeout(() => {

        expect(res.statusCode).to.equal(202);
        expect(res.result).to.equal(null);
        db.recoveries.findOne({ email: user.email }).then((recovery) => {

          expect(recovery).to.exist();
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

  describe('with existing recovery', () => {

    const recovery = Fixtures.recovery({ email: user.email });
    before(() => {

      return db.recoveries.insert(recovery);
    });

    it('does nothing', (done) => {

      server.inject({ method: 'post', url: '/user/recover', payload: { email: user.email } }).then((res) => {

        //Wait for promises to fire asynchronously
        setTimeout(() => {

          expect(res.statusCode).to.equal(202);
          expect(res.result).to.equal(null);
          db.recoveries.findOne({ email: user.email }).then((existingRecovery) => {

            expect(existingRecovery).to.include(recovery);
            done();
          });
        }, 50);
      });
    });
  });
});
