/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    const exists = await knex.schema.hasTable('refresh_token');
    if (!exists) {
        await knex.schema.createTable('refresh_token', table => {
            table.increments('id').primary();
            table.text('token').notNullable();
            table.integer('user_id').unsigned().notNullable();
            table.timestamp('created_at').defaultTo(knex.fn.now());

            table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
        });
    }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTable('refresh_token');
};
