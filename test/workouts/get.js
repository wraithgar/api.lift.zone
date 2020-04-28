'use strict'

const Faker = require('faker')

const Fixtures = require('../fixtures')

const { db, Server, expect } = Fixtures

const lab = (exports.lab = require('@hapi/lab').script())

const { before, after, describe, it } = lab

describe('GET /workouts/{id}', () => {
  let server
  const user = Fixtures.user()
  const workout = Fixtures.workout({ user_id: user.id }, true)

  before(async () => {
    server = await Server
    await db.users.insert(user)
    await Promise.all([db.workouts.insert(workout)])
  })

  after(async () => {
    await db.users.destroy({ id: user.id })
  })

  it('gets a workout', async () => {
    const res = await server.inject({
      method: 'get',
      url: `/workouts/${workout.id}`,
      auth: { strategy: 'jwt', credentials: user }
    })
    expect(res.statusCode).to.equal(200)
    expect(res.result).to.include({ id: workout.id, name: workout.name })
  })

  it('does not find nonexistant workout', async () => {
    const res = await server.inject({
      method: 'get',
      url: `/workouts/${Faker.random.uuid()}`,
      auth: { strategy: 'jwt', credentials: user }
    })

    expect(res.statusCode).to.equal(404)
  })
})
