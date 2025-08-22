/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.hasTable("user").then(function(exists) {
    if (!exists) {
      return knex.schema.createTable("user", function (table) {
        table.string("id").primary();
        table.string("first_name").notNullable();
        table.string("last_name").notNullable();
        table.string("email").notNullable().unique();
        table.string("password").notNullable();
        table.string("securityQuestions").defaultTo("[]"); // Store security questions as JSON string
        table.boolean("is_admin").defaultTo(false);
        table.timestamps(true, true);
      });
    }
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.dropTableIfExists("user");
} 