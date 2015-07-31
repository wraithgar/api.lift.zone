/*eslint camelcase:0*/

exports.seed = function (knex, Promise) {

    return knex.table('users').first('id').where({login: 'admin'}).then(function (user) {

        if (user === undefined) {
            throw new Error('Admin user missing');
        }
        return user;
    }).then(function (user) {

        var activities = [{name: 'Squat', aliases: ['Front Squat', 'Squats'] }];
        return knex.table('useractivities').count('id as ids').where({user_id: user.id, useractivity_id: null}).then(function (useractivities) {

            var ids = useractivities[0].ids;
            return Promise.each(activities.slice(ids), function (activity) {

                return knex.table('useractivities').insert({name: activity.name, user_id: user.id});
            });
        }).then(function () {

            return Promise.each(activities, function (activity) {

                return knex.table('useractivities').first('id').where({name: activity.name}).then(function (activityId) {

                    return knex.table('useractivities').count('id as ids').where({useractivity_id: activityId.id}).then(function (aliascount) {

                        var aliases = aliascount[0].ids;
                        return Promise.each(activity.aliases.slice(aliases), function (alias) {

                            return knex.table('useractivities').insert({name: alias, useractivity_id: activityId.id, user_id: user.id});
                        });
                    });
                });
            });
        });
    });
};
