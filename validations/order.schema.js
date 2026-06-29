'use strict';

const { z } = require('zod');

const orderStatusEnum = z.enum(
  ['PENDING', 'CONFIRMED', 'SHIPPED', 'CANCELLED'],
  {
    error: 'status must be one of: PENDING, CONFIRMED, SHIPPED, CANCELLED',
  },
);

// Association to Customers not null -> FK as it actually appears in req.data
const customer_ID = z.uuid('customer_ID must be a valid UUID');

const notes = z
  .string()
  .trim()
  .max(500, { message: 'notes must be at most 500 characters' })
  .optional();

const cancellationReason = z
  .string()
  .trim()
  .max(500, { message: 'cancellationReason must be at most 500 characters' })
  .optional();

// --- Nested OrderItems, for deep-insert payloads (POST /Orders with items[]) ---
// Mirrors orderItems.schema.js createOrderItemSchema but without order_ID,
// since the parent ID isn't known yet on a deep insert -- CAP fills it in.
const nestedOrderItemSchema = z.object({
  product_ID: z.uuid('product_ID must be a valid UUID'),
  quantity: z
    .number({ error: 'quantity must be a number' })
    .int({ message: 'quantity must be an integer' })
    .positive({ message: 'quantity must be greater than 0' }),
  // unitPrice: z
  //   .number({ error: 'unitPrice must be a number' })
  //   .nonnegative({ message: 'unitPrice cannot be negative' })
  //   .refine((val) => Number(val.toFixed(2)) === val, {
  //     message: 'unitPrice must have at most 2 decimal places',
  //   }),
  currency_code: z
    .string()
    .length(3, {
      message: 'currency_code must be a 3-letter ISO 4217 code (e.g. USD)',
    })
    .regex(/^[A-Z]{3}$/, {
      message: 'currency_code must be uppercase letters (e.g. USD)',
    })
    .optional(),
});

const createOrderSchema = z.object({
  customer_ID,
  status: orderStatusEnum.default('PENDING'),
  notes,
  // Optional: only present on a deep-insert create. Plain create (no nested
  // items) is equally valid -- items get added later via the composition.
  items: z
    .array(nestedOrderItemSchema)
    .min(1, { message: 'An order must contain at least one item' })
    .optional(),
});

const updateOrderSchema = z
  .object({
    customer_ID: customer_ID.optional(),
    status: orderStatusEnum.optional(),
    notes,
    cancellationReason,
  })
  // CANCELLED orders must carry a reason. This rule is NOT in the CDS schema
  // itself -- it's inferred from the existence of `cancellationReason`.
  // Delete this .refine() if that inference is wrong for your business logic.
  .refine((data) => data.status !== 'CANCELLED' || !!data.cancellationReason, {
    message: 'cancellationReason is required when status is CANCELLED',
    path: ['cancellationReason'],
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

// Dedicated schema for a status-transition-only endpoint
// (e.g. PATCH /Orders(:id)/status as a bound/custom action), kept separate
// from the general update schema so its single cross-field rule stays simple.
const updateOrderStatusSchema = z
  .object({
    status: orderStatusEnum,
    cancellationReason,
  })
  .refine((data) => data.status !== 'CANCELLED' || !!data.cancellationReason, {
    message: 'cancellationReason is required when status is CANCELLED',
    path: ['cancellationReason'],
  });

module.exports = {
  orderStatusEnum,
  createOrderSchema,
  updateOrderSchema,
  updateOrderStatusSchema,
  nestedOrderItemSchema,
};
