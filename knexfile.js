// knex cli looks to this file


module.exports = {

    test: {
        client: 'sqlite3',
        connection: {
            filename: ':memory:'
        }
    },

    development: {
        client: 'sqlite3',
        connection: {
            filename: './dev.sqlite3'
        }
    },

    production: {
        client: 'sqlite3',
        connection: {
            filename: './production.sqlite3'
        }
    }

};
