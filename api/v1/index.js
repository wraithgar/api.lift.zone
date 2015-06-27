var User = require('./controllers/user');

exports.register = function (plugin, options, done) {

    plugin.dependency('hapi-auth-jwt');

    plugin.bind({ db: options.db, config: options.config });

    plugin.auth.strategy('user-token', 'jwt', {
        key: options.config.jwt.privateKey,
        validateFunc: plugin.app.utils.jwtValidate(options.db)
    });

    plugin.auth.default('user-token');

    plugin.route({ method: 'POST', path: '/recover', config: User.recover });
    plugin.route({ method: 'POST', path: '/signup', config: User.signup });
    plugin.route({ method: 'POST', path: '/validate', config: User.validate });
    plugin.route({ method: 'POST', path: '/reset', config: User.reset });
    plugin.route({ method: 'POST', path: '/login', config: User.login });
    plugin.route({ method: 'POST', path: '/logout', config: User.logout });
    plugin.route({ method: 'GET', path: '/me', config: User.me });
    plugin.route({ method: 'PUT', path: '/me', config: User.update });
    plugin.route({ method: 'GET', path: '/me/invites', config: User.invites });
    plugin.route({ method: 'POST', path: '/me/confirm', config: User.confirm });

    //available - check available accounts (need invite code)

    return done();
};

exports.register.attributes = {
    name: 'api.lift.zone',
    version: '1.0.0'
};
