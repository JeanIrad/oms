'use strict';

const { z } = require('zod');

const name = z
  .string({ error: 'name is required' })
  .trim()
  .min(1, { message: 'name cannot be empty' })
  .max(100, { message: 'name must be at most 100 characters' });

const description = z
  .string()
  .trim()
  .max(500, { message: 'description must be at most 500 characters' })
  .optional();

// Decimal(10,2), not null, @assert.range: [(0.001), _].
// CDS's lower bound of 0.001 is unreachable at 2 decimal places (it rounds to
// 0.00), so this is implemented as "strictly greater than zero".
const price = z.coerce
  .number({ error: 'price must be a number' })
  .gt(0, { message: 'price must be greater than 0' })
  .refine((val) => Number(val.toFixed(2)) === val, {
    message: 'price must have at most 2 decimal places',
  });

// Integer, @assert.range: [(0), _], custom CDS message.
// Defined WITHOUT .default() so it can be reused unchanged in the update
// schema -- a PATCH must never silently inject stock: 1 when omitted.
const stockRule = z
  .number({ error: 'stock must be a number' })
  .int({ message: 'stock must be an integer' })
  .min(0, { message: 'Stock cannot be less than zero!' });

// not null, default 1 -> the default only makes sense on create.
const stock = stockRule.default(1);

const category = z
  .string()
  .trim()
  .max(50, { message: 'category must be at most 50 characters' })
  .optional();

const imageUrl = z
  .string()
  .trim()
  .max(500, { message: 'imageUrl must be at most 500 characters' })
  .url('imageUrl must be a valid URL')
  .optional();

const imagePublicId = z
  .string()
  .trim()
  .max(500, { message: 'imagePublicId must be at most 500 characters' })
  .optional();

const createProductSchema = z.object({
  name,
  description,
  price,
  stock,
  category,
  imageUrl,
  imagePublicId,
});

// PATCH-style update: all fields optional, same per-field rules when present.
const updateProductSchema = z
  .object({
    name: name.optional(),
    description,
    price: price.optional(),
    stock: stockRule.optional(),
    category,
    imageUrl,
    imagePublicId,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

module.exports = {
  createProductSchema,
  updateProductSchema,
};
