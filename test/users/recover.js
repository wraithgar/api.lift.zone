'use strict'

const StandIn = require('stand-in')

const AWS = require('../../lib/aws')

const Faker = require('faker')

const Fixtures = require('../fixtures')

const { db, Server, expect } = Fixtures

const lab = (exports.lab = require('@hapi/lab').script())

const { before, after, afterEach, describe, it } = lab

describe('POST /user/recover', () => {
  let server
  const user1 = Fixtures.user({ logout: Faker.date.past() })
  const user2 = Fixtures.user({ logout: Faker.date.past(), validated: false })
  before(async () => {
    server = await Server
    await Promise.all([db.users.insert(user1), db.users.insert(user2)])
  })

  afterEach(async () => {
    await db.recoveries.destroy({ email: user1.email })
  })

  after(async () => {
    await Promise.all([
      db.users.destroy({ id: user1.id }),
      db.users.destroy({ id: user2.id })
    ])
  })

  it('creates a recovery', async () => {
    let sesParams
    StandIn.replace(AWS, 'sendEmail', (stand, params) => {
      stand.restore()
      sesParams = params
    })

    const res = await server.inject({
      method: 'post',
      url: '/user/recover',
      payload: { email: user1.email }
    })

    expect(res.statusCode).to.equal(202)
    expect(res.result).to.equal(null)
    const recovery = await db.recoveries.findOne({ email: user1.email })

    expect(recovery).to.exist()
    expect(sesParams.Destination.ToAddresses).to.include(user1.email)
    expect(sesParams.Message.Body.Text.Data).to.include(recovery.token)
  })

  it('ignores invalid email', async () => {
    const email = Faker.internet.email()
    const res = await server.inject({
      method: 'post',
      url: '/user/recover',
      payload: { email }
    })

    expect(res.statusCode).to.equal(202)
    expect(res.result).to.equal(null)
    const recovery = await db.recoveries.findOne({ email })
    expect(recovery).to.not.exist()
  })

  it('ignores non validated user', async () => {
    const res = await server.inject({
      method: 'post',
      url: '/user/recover',
      payload: { email: user2.email }
    })

    expect(res.statusCode).to.equal(202)
    expect(res.result).to.equal(null)
    const recovery = await db.recoveries.findOne({ email: user2.email })

    expect(recovery).to.not.exist()
  })

  describe('with existing recovery', () => {
    const recovery = Fixtures.recovery({ email: user1.email })
    before(async () => {
      await db.recoveries.insert(recovery)
    })

    it('does nothing', async () => {
      const res = await server.inject({
        method: 'post',
        url: '/user/recover',
        payload: { email: user1.email }
      })

      expect(res.statusCode).to.equal(202)
      expect(res.result).to.equal(null)
      const existingRecovery = await db.recoveries.findOne({
        email: user1.email
      })

      expect(existingRecovery).to.include(recovery)
    })
  })
})
