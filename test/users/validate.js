'use strict';

const StandIn = require('stand-in');
const AWS = require('../../lib/aws');

const Faker = require('faker');

const Fixtures = require('../fixtures');

const { db, Server, expect } = Fixtures;

const lab = exports.lab = require('@hapi/lab').script();

const { before, after, describe, it } = lab;

describe('POST /user/validate', () => {

  let server;
  const user1 = Fixtures.user({ validated: false });
  const user2 = Fixtures.user({ validated: false });
  const validation2 = Fixtures.validation({ user_id: user2.id });

  before(async () => {

    server = await Server;
    await Promise.all([
      db.users.insert(user1),
      db.users.insert(user2)
    ]);
    await db.validations.insert(validation2)
  });

  after(async () => {

    await Promise.all([
      db.users.destroy({ id: user1.id }),
      db.users.destroy({ id: user2.id })
    ]);
  });

  it('requests validation', async () => {

    let sesParams;
    StandIn.replace(AWS, 'sendEmail', (stand, params) => {

      stand.restore();
      sesParams = params;
    });

     const res = await server.inject({ method: 'post', url: '/user/validate', auth: { strategy: 'jwt', credentials: user1 } });

    expect(res.statusCode).to.equal(202);
    const createdValidation = await db.validations.findOne({ user_id: user1.id });
    expect(createdValidation).to.exist();
    expect(sesParams.Destination.ToAddresses).to.include(user1.email);
    expect(sesParams.Message.Body.Text.Data).to.include(createdValidation.token);
  });

  it('ignores if validation exists', async () => {

    const res = await server.inject({ method: 'post', url: '/user/validate', auth: { strategy: 'jwt', credentials: user2 } });

    expect(res.statusCode).to.equal(202);
    const createdValidation = await db.validations.findOne({ user_id: user2.id });
    expect(createdValidation).to.include(validation2);
  });
});
