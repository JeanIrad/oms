'use strict';

const { z } = require('zod');

const statusEnumRule = z.enum(['Active', 'Inactive', 'Blocked'], {
  error: "status must be one of: 'Active', 'Inactive', 'Blocked'",
});

const name = z
  .string({ error: 'name is required' })
  .trim()
  .min(1, { message: 'name cannot be empty' })
  .max(100, { message: 'name must be at most 100 characters' });

const email = z
  .string()
  .max(200, { message: 'email must be at most 200 characters' })
  .email('email must be a valid email address');

const phone = z
  .string()
  .trim()
  .max(20, { message: 'phone must be at most 20 characters' })
  .regex(/^[+0-9()\-.\s]+$/, { message: 'phone contains invalid characters' })
  .optional();

const address = z
  .string()
  .trim()
  .max(300, { message: 'address must be at most 300 characters' })
  .optional();

const createCustomerSchema = z.object({
  name,
  email,
  phone,
  address,
  status: statusEnumRule.default('Active'),
});

const updateCustomerSchema = z
  .object({
    name: name.optional(),
    email: email.optional(),
    phone,
    address,
    status: statusEnumRule.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

module.exports = {
  createCustomerSchema,
  updateCustomerSchema,
};
