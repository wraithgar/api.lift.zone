'use strict'

const Fixtures = require('./fixtures')

const { Server, expect } = Fixtures

const lab = (exports.lab = require('@hapi/lab').script())

const { before, describe, it } = lab

describe('GET /heartbeat', () => {
  let server
  before(async () => {
    server = await Server
  })

  it('gets a heartbeat', async () => {
    const res = await server.inject({ method: 'get', url: '/heartbeat' })

    expect(res.statusCode).to.equal(200)
    expect(res.result).to.include('ok')
  })
})
