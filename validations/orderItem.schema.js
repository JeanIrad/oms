'use strict';

const { z } = require('zod');

const order_ID = z.uuid('order_ID must be a valid UUID');

const product_ID = z.uuid('product_ID must be a valid UUID');

const quantity = z
  .number({ error: 'quantity must be a number' })
  .int({ message: 'quantity must be an integer' })
  .positive({ message: 'quantity must be greater than 0' });

const unitPrice = z
  .number({ error: 'unitPrice must be a number' })
  .nonnegative({ message: 'unitPrice cannot be negative' })
  .refine((val) => Number(val.toFixed(2)) === val, {
    message: 'unitPrice must have at most 2 decimal places',
  });

const currency_code = z
  .string()
  .length(3, {
    message: 'currency_code must be a 3-letter ISO 4217 code (e.g. USD)',
  })
  .regex(/^[A-Z]{3}$/, {
    message: 'currency_code must be uppercase letters (e.g. USD)',
  })
  .optional();

// Standalone create, e.g. POST /Orders(:id)/items
const createOrderItemSchema = z.object({
  order_ID,
  product_ID,
  quantity,
  // unitPrice,
  currency_code,
});

const updateOrderItemSchema = z
  .object({
    product_ID: product_ID.optional(),
    quantity: quantity.optional(),
    unitPrice: unitPrice.optional(),
    currency_code,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

module.exports = {
  createOrderItemSchema,
  updateOrderItemSchema,
};
