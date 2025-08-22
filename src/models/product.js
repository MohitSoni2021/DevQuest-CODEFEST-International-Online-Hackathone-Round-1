import Joi from "joi";

class Product {
  constructor(id, name, description, sku, price, stockQuantity = 0, reorderLevel = 10, category = "general", isActive = true, supplierId, userId) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.sku = sku;
    this.price = price;
    this.stockQuantity = stockQuantity;
    this.reorderLevel = reorderLevel;
    this.category = category;
    this.isActive = isActive;
    this.supplierId = supplierId;
    this.userId = userId;
  }

  validate = () => {
    const schema = Joi.object({
      id: Joi.string().uuid().required(),
      name: Joi.string().min(1).max(200).required(),
      description: Joi.string().max(1000).allow("", null),
      sku: Joi.string().min(1).max(50).required(),
      price: Joi.number().min(0).precision(2).required(),
      stockQuantity: Joi.number().integer().min(0).required(),
      reorderLevel: Joi.number().integer().min(0).required(),
      category: Joi.string().valid("electronics", "clothing", "books", "food", "home", "sports", "general").required(),
      isActive: Joi.boolean().required(),
      supplierId: Joi.string().allow(null),
      userId: Joi.string().uuid().required(),
    });

    return schema.validate({
      id: this.id,
      name: this.name,
      description: this.description,
      sku: this.sku,
      price: this.price,
      stockQuantity: this.stockQuantity,
      reorderLevel: this.reorderLevel,
      category: this.category,
      isActive: this.isActive,
      supplierId: this.supplierId,
      userId: this.userId,
    });
  };

  validateCreate = () => {
    const schema = Joi.object({
      name: Joi.string().min(1).max(200).required(),
      description: Joi.string().max(1000).allow("", null),
      sku: Joi.string().min(1).max(50).required(),
      price: Joi.number().min(0).precision(2).required(),
      stockQuantity: Joi.number().integer().min(0).default(0),
      reorderLevel: Joi.number().integer().min(0).default(10),
      category: Joi.string().valid("electronics", "clothing", "books", "food", "home", "sports", "general").default("general"),
      supplierId: Joi.string().allow(null),
    });

    return schema.validate({
      name: this.name,
      description: this.description,
      sku: this.sku,
      price: this.price,
      stockQuantity: this.stockQuantity,
      reorderLevel: this.reorderLevel,
      category: this.category,
      supplierId: this.supplierId,
    });
  };

  validateUpdate = () => {
    const schema = Joi.object({
      name: Joi.string().min(1).max(200),
      description: Joi.string().max(1000).allow("", null),
      sku: Joi.string().min(1).max(50),
      price: Joi.number().min(0).precision(2),
      stockQuantity: Joi.number().integer().min(0),
      reorderLevel: Joi.number().integer().min(0),
      category: Joi.string().valid("electronics", "clothing", "books", "food", "home", "sports", "general"),
      isActive: Joi.boolean(),
      supplierId: Joi.string().allow(null),
    });

    return schema.validate({
      name: this.name,
      description: this.description,
      sku: this.sku,
      price: this.price,
      stockQuantity: this.stockQuantity,
      reorderLevel: this.reorderLevel,
      category: this.category,
      isActive: this.isActive,
      supplierId: this.supplierId,
    });
  };

  // Business logic method to check if product needs reordering
  needsReorder = () => {
    return this.stockQuantity <= this.reorderLevel;
  };

  // Business logic method to calculate stock value
  calculateStockValue = () => {
    return this.stockQuantity * this.price;
  };
}

export default Product; 