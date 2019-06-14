'use strict';

const Fixtures = require('./fixtures');

const { db, Server, lab_script, expect } = Fixtures;

const lab = exports.lab = lab_script;

const { before, describe, it } = lab;

describe('GET /heartbeat', () => {

  let server;
  before(async () => {

    server = await Server;
  });

  it('gets a heartbeat', async () => {

    const res = await server.inject({ method: 'get', url: '/heartbeat' });

    expect(res.statusCode).to.equal(200);
    expect(res.result).to.include('ok');
  });
});
