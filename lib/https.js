'use strict';
//$lab:coverage:off$

exports.register = function (server, options, next) {

  server.ext('onRequest', (request, reply) => {

    //We only care about x-forwarded-proto, this prevents https redirect for local development
    if (request.headers['x-forwarded-proto'] === 'http') {
      return reply()
        .redirect(`https://${request.headers['x-forwarded-host']}${request.url.path}`)
        .code(301);
    }
    reply.continue();
  });
  next();
};

exports.register.attributes = {
  name: 'auto-https-redirect'
};
//$lab:coverage:on$
