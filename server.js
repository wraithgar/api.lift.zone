'use strict';

const Config = require('getconfig');
const Hapi = require('hapi');
const Muckraker = require('muckraker');

const db = new Muckraker(Config.db);

Config.hapi.cache.engine = require(Config.hapi.cache.engine);

const server = new Hapi.Server(Config.hapi);
server.connection(Config.connection.public);

server.on('request-error', (err, m) => {

  console.log(m);
} );



module.exports = server.register([{
  register: require('good'),
  options: Config.good
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

  //server.bind here

  server.auth.strategy('jwt', 'jwt', {
    key: Config.auth.secret,
    verifyOptions: {
      algorithms: [Config.auth.options.algorithm]
    },
    validateFunc: (decoded, request, callback) => {

      db.users.selfByEmail(decoded.email).then((user) => {

        if (!user) {
          return callback(null, false);
        }

        if (user.invalidated_at &&
          Date.parse(decoded.timestamp) < user.invalidated_at.getTime()) {

          return callback(null, false);
        }

        return callback(null, true, decoded);
      }).catch(callback);
    }
  });
  //server.route(require('./routes');
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
