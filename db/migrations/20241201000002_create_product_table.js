/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.hasTable("product").then(function(exists) {
    if (!exists) {
      return knex.schema.createTable("product", function (table) {
        table.string("id").primary();
        table.string("name").notNullable();
        table.text("description");
        table.string("sku").unique().notNullable();
        table.decimal("price", 10, 2).notNullable();
        table.integer("stock_quantity").defaultTo(0);
        table.integer("reorder_level").defaultTo(10);
        table.string("category").defaultTo("general"); // electronics, clothing, books, etc.
        table.boolean("is_active").defaultTo(true);
        table.string("supplier_id");
        table.string("user_id").notNullable(); // Manager who added the product
        table.timestamps(true, true);
        
        table.foreign("user_id").references("id").inTable("user").onDelete("CASCADE");
      });
    }
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.dropTableIfExists("product");
} 