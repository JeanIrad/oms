'use strict';

const { z } = require('zod');

// cuid aspect -> server-generated UUID primary key (the `ID` field)
const uuidSchema = z.uuid('Must be a valid UUID');

// Currency (from @sap/cds/common) is a managed association to a `Currencies`
// reference-data entity keyed by `code` (3-letter ISO 4217). In req.data this
// arrives as `currency_code`, not a bare `currency` string.
const currencyCodeSchema = z
  .string()
  .length(3, {
    message: 'currency_code must be a 3-letter ISO 4217 code (e.g. USD)',
  })
  .regex(/^[A-Z]{3}$/, {
    message: 'currency_code must be uppercase letters (e.g. USD)',
  });

module.exports = {
  uuidSchema,
  currencyCodeSchema,
};
