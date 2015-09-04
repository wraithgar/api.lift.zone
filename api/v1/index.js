var User = require('./controllers/user');
var ActivityNames = require('./controllers/activity-names');

exports.register = function (plugin, options, done) {

    var crud = function (resource, Controller) {

        if (Controller.hasOwnProperty('all')) { plugin.route({ method: 'GET', path: resource, config: Controller.all }); }
        if (Controller.hasOwnProperty('get')) { plugin.route({ method: 'GET', path: resource + '/{id}', config: Controller.get }); }
        if (Controller.hasOwnProperty('create')) { plugin.route({ method: 'POST', path: resource, config: Controller.create }); }
        if (Controller.hasOwnProperty('update')) { plugin.route({ method: 'PUT', path: resource + '/{id}', config: Controller.update }); }
        if (Controller.hasOwnProperty('delete')) { plugin.route({ method: 'DELETE', path: resource + '/{id}', config: Controller.delete }); }
    };

    plugin.dependency('hapi-auth-jwt');

    plugin.bind({ db: options.db, config: options.config });

    plugin.auth.strategy('user-token', 'jwt', {
        key: options.config.jwt.privateKey,
        validateFunc: plugin.app.utils.jwtValidate(options.db)
    });

    plugin.auth.default('user-token');

    /* User */
    plugin.route({ method: 'POST', path: '/recover', config: User.recover });
    plugin.route({ method: 'POST', path: '/signup', config: User.signup });
    plugin.route({ method: 'POST', path: '/validate', config: User.validate });
    plugin.route({ method: 'POST', path: '/reset', config: User.reset });
    plugin.route({ method: 'POST', path: '/login', config: User.login });
    plugin.route({ method: 'POST', path: '/logout', config: User.logout });
    plugin.route({ method: 'POST', path: '/taken', config: User.taken });
    plugin.route({ method: 'GET', path: '/invite/{code}', config: User.invite });
    plugin.route({ method: 'GET', path: '/me', config: User.me });
    plugin.route({ method: 'PUT', path: '/me', config: User.update });
    plugin.route({ method: 'GET', path: '/me/invites', config: User.invites });
    plugin.route({ method: 'POST', path: '/me/confirm', config: User.confirm });

    /* ActivityName */
    crud('/activityNames', ActivityNames);
    plugin.route({ method: 'POST', path: '/search/activityNames', config: ActivityNames.search });

    return done();
};

exports.register.attributes = {
    name: 'api.lift.zone',
    version: '1.0.0'
};
