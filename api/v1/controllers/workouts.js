'use strict';
const Joi = require('joi');

const controllers = {};

module.exports = controllers;

controllers._id = 'date';

controllers.get = {
    description: 'Get workout for given day',
    tags: ['workout'],
    handler: function (request, reply) {

        const user = request.auth.credentials.user;

        return reply(user.related('workout').getOne(request.params, { withRelated: ['activities', 'activities.activityName', 'activities.sets'] }).then(function (workout) {

            return { data: workout };
        }));
    },
    validate: {
        params: {
            date: Joi.date().format('YYYY-MM-DD').raw()
        }
    }
};

controllers.create = {
    description: 'Create a new workout',
    tags: ['workout'],
    handler: function (request, reply) {
    },
    validate: {
        payload: {
            name: Joi.string().required().example('Front Squat'),
            raw: Joi.string().required(),
            date: Joi.date().required().format('YYYY-MM-DD').raw(),
            activities: {
                comment: Joi.string(),
                //TODO limit sets attributes weight or (distance and/or time)
                sets: Joi.array().items(
                    Joi.object().keys({
                        pr: Joi.bool(),
                        reps: Joi.number(),
                        weight: Joi.number(),
                        unit: Joi.string(),
                        distance: Joi.number(),
                        time: Joi.number()
                    })
                ).min(1)
            }
        }
    }
};
