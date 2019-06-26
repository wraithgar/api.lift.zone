'use strict';
//$lab:coverage:off$

const register = function(server) {
  server.ext('onRequest', (request, h) => {
    if (
      process.env.HTTPS_REDIRECT === 'true' &&
      request.headers['x-forwarded-proto'] === 'http'
    ) {
      return h
        .redirect(
          `https://${request.headers['x-forwarded-host']}${request.url.path}`
        )
        .permanent()
        .takeover();
    }
    return h.continue;
  });
};

module.exports = {
  register,
  name: 'auto-https-redirect'
};
//$lab:coverage:on$
