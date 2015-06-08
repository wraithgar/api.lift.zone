
exports.up = function (knex) {

    return knex.schema
    .raw('CREATE VIRTUAL TABLE activitynames USING FTS4 (tokenize=porter, content=useractivities, name)')
    .raw('CREATE TRIGGER useractivities_bu BEFORE UPDATE ON useractivities BEGIN\n' +
         '    DELETE FROM activitynames where docid = old.rowid;\n' +
         'END;')
    .raw('CREATE TRIGGER useractivities_bd BEFORE DELETE ON useractivities BEGIN\n' +
         '   DELETE FROM activitynames where docik = old.rowid; \n' +
         'END;')
    .raw('CREATE TRIGGER useractivites_au AFTER UPDATE ON useractivities BEGIN\n' +
         '   INSERT INTO activitynames (docid, name) VALUES (new.rowid, new.name);\n' +
         'END;')
    .raw('CREATE TRIGGER useractivites_ai AFTER INSERT ON useractivities BEGIN\n' +
         '   INSERT INTO activitynames (docid, name) VALUES (new.rowid, new.name);\n' +
         'END;')
    ;
};

exports.down = function (knex) {

    return knex.schema.dropTableIfExists('activitynames');
};
