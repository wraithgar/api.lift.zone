'use strict'

const Fixtures = require('./fixtures')

const { db, Server, expect } = Fixtures

const lab = (exports.lab = require('@hapi/lab').script())

const { before, after, describe, it } = lab

describe('auth', () => {
  let server
  const user = Fixtures.user()
  before(async () => {
    server = await Server
    await db.users.insert(user)
  })

  after(async () => {
    await db.users.destroy({ id: user.id })
  })

  it('can make a request with a jwt (with and without Bearer in the header)', async () => {
    let res = await server.inject({
      method: 'post',
      url: '/user/login',
      payload: { email: user.email, password: user.password }
    })

    expect(res.statusCode).to.equal(201)
    let result = res.result
    expect(result).to.be.an.object()
    expect(result.token).to.be.a.string()
    const token = result.token
    res = await server.inject({
      method: 'get',
      url: '/user',
      headers: { authorization: token }
    })
    expect(res.statusCode).to.equal(200)
    res = await server.inject({
      method: 'get',
      url: '/user',
      headers: { authorization: `Bearer ${token}` }
    })
    expect(res.statusCode).to.equal(200)
    result = res.result

    expect(result).to.be.an.object()
    expect(result).to.not.part.include(['hash'])
    expect(result.email).to.equal(user.email)
  })

  it(
    'does not allow a user to auth with a stale jwt after logging out',
    { timeout: 3000 },
    async () => {
      let res = await server.inject({
        method: 'post',
        url: '/user/login',
        payload: { email: user.email, password: user.password }
      })

      expect(res.statusCode).to.equal(201)
      const result = res.result
      expect(result).to.be.an.object()
      expect(result.token).to.be.a.string()

      res = await server.inject({
        method: 'get',
        url: '/user',
        headers: { authorization: result.token }
      })
      expect(res.statusCode).to.equal(200)
      const usr = res.result
      expect(usr).to.be.an.object()
      expect(usr.email).to.equal(user.email)
      const later = new Date(Date.now() + 2500)

      await db.users.updateOne({ id: usr.id }, { logout: later })

      res = await server.inject({
        method: 'get',
        url: '/user',
        headers: { authorization: result.token }
      })
      expect(res.statusCode).to.equal(401)
    }
  )

  it('fails auth when a user is set to inactive after logging in', async () => {
    let res = await server.inject({
      method: 'post',
      url: '/user/login',
      payload: { email: user.email, password: user.password }
    })

    expect(res.statusCode).to.equal(201)
    const result = res.result
    expect(result).to.be.an.object()
    expect(result.token).to.be.a.string()
    await db.users.update({ id: user.id }, { active: false })
    res = await server.inject({
      method: 'get',
      url: '/user',
      headers: { authorization: result.token }
    })
    expect(res.statusCode).to.equal(401)
  })
})
