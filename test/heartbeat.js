'use strict';

const Server = require('../server');

const lab = exports.lab = require('lab').script();
const expect = require('code').expect;

const before = lab.before;
const describe = lab.describe;
const it = lab.it;

describe('GET /heartbeat', () => {

  let server;
  before(() => {

    return Server.then((s) => {

      server = s;
    });
  });

  it('gets a heartbeat', () => {

    return server.inject({ method: 'get', url: '/heartbeat' }).then((res) => {

      expect(res.statusCode).to.equal(200);
      expect(res.result).to.include('ok');
    });
  });
});
