'use strict';
//$lab:coverage:off$

exports.register = function (server, options, next) {

  server.ext('onRequest', (request, reply) => {

    if (process.env.HTTPS_REDIRECT === 'true' && request.headers['x-forwarded-proto'] === 'http') {
      return reply()
        .redirect(`https://${request.headers['x-forwarded-host']}${request.url.path}`)
        .permanent();
    }
    reply.continue();
  });
  next();
};

exports.register.attributes = {
  name: 'auto-https-redirect'
};
//$lab:coverage:on$
