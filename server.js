'use strict';

const Config = require('getconfig');
const Hapi = require('@hapi/hapi');
const Muckraker = require('muckraker');

const Utils = require('./lib/utils');

const db = new Muckraker(Config.db);

//$PORT is not set during postinstall, so we can't
//include it in the config, hence this if statement
//$lab:coverage:off$
if (process.env.NODE_ENV === 'production') {
  Config.hapi.port = process.env.PORT;
}
//$lab:coverage:on$

const server = new Hapi.Server(Config.hapi);

//$lab:coverage:off$
process.on('SIGTERM', async () => {
  server.log(['info', 'shutdown'], 'Graceful shutdown');
  await server.stop({ timeout: Config.shutdownTimeout });
  process.exit(0);
});

if (process.env.NODE_ENV !== 'production') {
  server.events.on(
    { name: 'request', channels: ['error'] },
    (request, event) => {
      console.log(event.stack || event);
    }
  );
}
//$lab:coverage:on$

module.exports.db = db;

module.exports.server = server
  .register([
    {
      plugin: require('./lib/jwt_authorization')
    },
    {
      plugin: require('@hapi/inert')
    },
    {
      plugin: require('@hapi/vision')
    },
    {
      plugin: require('hapi-pino'),
      options: Config.pino
    },
    {
      //This has to come after hapi-pino
      plugin: require('./lib/https')
    },
    {
      plugin: require('hapi-rate-limit'),
      options: Config.rateLimit
    },
    {
      plugin: require('@now-ims/hapi-now-auth')
    },
    {
      plugin: require('hapi-pagination'),
      options: Config.pagination
    }
  ])
  .then(() => {
    server.bind({
      db,
      utils: Utils
    });
    server.auth.strategy('jwt', 'hapi-now-auth', {
      verifyJWT: true,
      keychain: [Config.auth.secret],
      tokenType: 'Bearer',
      verifyOptions: {
        algorithms: [Config.auth.options.algorithm]
      },
      validate: async (request, token) => {
        const decoded = token.decodedJWT;
        const user = await db.users.active(decoded.email);

        if (!user) {
          return { isValid: false, credentials: decoded };
        }

        if (Date.parse(decoded.timestamp) < user.logout.getTime()) {
          return { isValid: false, credentials: decoded };
        }

        return { isValid: true, credentials: user };
      }
    });
    server.auth.default('jwt');

    server.route(require('./routes'));
  })
  .then(async () => {
    // coverage disabled because module.parent is always defined in tests
    // $lab:coverage:off$
    if (module.parent) {
      await server.initialize();
      return server;
    }

    await server.start();

    server.log(['info', 'startup'], server.info.uri);
    // $lab:coverage:on$
  })
  .catch(err => {
    // coverage disabled due to difficulty in faking a throw
    // $lab:coverage:off$
    console.error(err.stack || err);
    process.exit(1);
    // $lab:coverage:on$
  });
