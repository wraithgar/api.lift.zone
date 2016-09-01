'use strict';

const Config = require('getconfig');
const Hapi = require('hapi');
const Muckraker = require('muckraker');

const Utils = require('./lib/utils');

const db = new Muckraker(Config.db);

Config.hapi.cache.engine = require(Config.hapi.cache.engine);

const server = new Hapi.Server(Config.hapi);
server.connection(Config.connection.public);

//$lab:coverage:off$
process.on('SIGTERM', () => {

  server.log(['info', 'shutdown'], 'Graceful shutdown');
  server.stop({ timeout: Config.shutdownTimeout }).then(() => {

    return process.exit(0);
  });
});

if (process.env.NODE_ENV !== 'production') {
  server.on('request-error', (err, m) => {

    console.log(m.stack);
  } );
}
//$lab:coverage:on$

module.exports = server.register([{
  register: require('good'),
  options: Config.good
}, {
  register: require('hapi-rate-limit'),
  options: Config.rateLimit
}, {
  register: require('drboom'),
  options: {
    plugins: [
      require('drboom-joi')({ Boom: require('boom') }),
      require('drboom-pg')({})
    ]
  }
}, {
  register: require('hapi-auth-jwt2')
}]).then(() => {

  server.bind({
    db,
    utils: Utils
  });

  server.auth.strategy('jwt', 'jwt', true, {
    key: Config.auth.secret,
    verifyOptions: {
      algorithms: [Config.auth.options.algorithm]
    },
    validateFunc: (decoded, request, callback) => {

      db.users.active(decoded.email).then((user) => {

        if (!user) {
          return callback(null, false);
        }

        if (Date.parse(decoded.timestamp) < user.logout.getTime()) {

          return callback(null, false);
        }

        delete user.hash;
        return callback(null, true, user);
      }).catch(callback);
    }
  });

  server.route(require('./routes'));
}).then(() => {

  // coverage disabled because module.parent is always defined in tests
  // $lab:coverage:off$
  if (module.parent) {
    return server.initialize().then(() => {

      return server;
    });
  }

  return server.start().then(() => {

    server.connections.forEach((connection) => {

      server.log(['info', 'startup'], `${connection.info.uri} ${connection.settings.labels}`);
    });
  });
  // $lab:coverage:on$
}).catch((err) => {

  // coverage disabled due to difficulty in faking a throw
  // $lab:coverage:off$
  console.error(err.stack || err);
  process.exit(1);
  // $lab:coverage:on$
});
