'use strict'

const Faker = require('faker')

const Fixtures = require('../fixtures')

const { db, Server, expect } = Fixtures

const lab = (exports.lab = require('@hapi/lab').script())

const { before, after, describe, it } = lab

describe('POST /user/logout', () => {
  let server
  const user = Fixtures.user({ logout: Faker.date.past() })
  before(async () => {
    server = await Server
    await db.users.insert(user)
  })

  after(async () => {
    await db.users.destroy({ id: user.id })
  })

  it('can logout', async () => {
    const res = await server.inject({
      method: 'post',
      url: '/user/logout',
      auth: { strategy: 'jwt', credentials: user }
    })

    expect(res.statusCode).to.equal(204)
    const updatedUser = await db.users.findOne({ id: user.id })
    expect(updatedUser.logout).to.be.above(user.logout)
  })
})
