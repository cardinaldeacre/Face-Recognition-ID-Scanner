/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    const exists = await knex.schema.hasTable('attendance_logs');
    if (!exists) {
        return knex.schema.createTable('attendance_logs', table => {
            table.increments('id').primary();
            table.integer('permission_id').unsigned().references('id').inTable('permissions').onDelete('SET NULL');
            table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
            table.enum('type', ['IN', 'OUT']).notNullable();
            table.timestamp('timestamp').defaultTo(knex.fn.now());
        });
    }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTableIfExists('attendance_logs');
};
