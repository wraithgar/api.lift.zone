'use strict'

const Faker = require('faker')

const Fixtures = require('../fixtures')

const { db, Server, expect } = Fixtures

const lab = (exports.lab = require('@hapi/lab').script())

const { before, after, describe, it } = lab

describe('GET /invites/{token}', () => {
  let server
  const user = Fixtures.user()
  const invite1 = Fixtures.invite({ user_id: user.id })
  const invite2 = Fixtures.invite({ user_id: user.id, claimed_by: user.id })
  before(async () => {
    server = await Server
    await db.users.insert(user)
    await Promise.all([db.invites.insert(invite1), db.invites.insert(invite2)])
  })

  after(async () => {
    await db.users.destroy({ id: user.id })
  })

  it('unclaimed invite', async () => {
    const res = await server.inject({
      method: 'get',
      url: `/invites/${invite1.token}`
    })

    expect(res.statusCode).to.equal(200)
    expect(invite1).to.include(res.result)
  })

  it('claimed invite', async () => {
    const res = await server.inject({
      method: 'get',
      url: `/invites/${invite2.token}`
    })

    expect(res.statusCode).to.equal(404)
  })

  it('invalid invite', async () => {
    const token = Faker.random.uuid()
    const res = await server.inject({
      method: 'get',
      url: `/invites/${token}`
    })

    expect(res.statusCode).to.equal(404)
  })
})
