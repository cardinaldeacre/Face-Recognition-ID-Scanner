/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    const exist = await knex.schema.hasTable('users');
    if (!exist) {
        return knex.schema.createTable('users', table => {
            table.increments('id').primary();
            table.string('nama').notNullable();
            table.string('nim').unique().notNullable();
            table.string('password').notNullable();
            table.string('prodi');
            table.integer('semester');
            table.text('url_photo');
            table.jsonb('face_embedding');
            table.string('role').defaultTo('student');
            table.timestamps(true, true);
        })
    }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTableIfExists('users')
};
