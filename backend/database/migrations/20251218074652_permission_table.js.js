/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    const exists = await knex.schema.hasTable('permissions');
    if (!exists) {
        return knex.schema.createTable('permissions', table => {
            table.increments('id').primary();
            table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
            table.enum('status', ['waiting', 'accepted', 'denied', 'violation']).defaultTo('waiting');
            table.text('reason');
            table.integer('duration');
            table.timestamp('start_time');
            table.timestamp('end_time');
            table.timestamps(true, true);
        });
    }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTableIfExists('permissions')
};
