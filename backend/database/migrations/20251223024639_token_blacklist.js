/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    const exists = await knex.schema.hasTable('token_blacklist');
    if (!exists) {
        await knex.schema.createTable('token_blacklist', table => {
            table.increments('id').primary();
            table.text('token').notNullable();
            table.timestamp('created_at').defaultTo(knex.fn.now());
        });
    }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTable('token_blacklist');
};
