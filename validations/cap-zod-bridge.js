'use strict';

/**
 * Maps a failed Zod safeParse() result onto a CAP request, using req.error()
 * (not req.reject()) so that ALL field issues are collected and reported in
 * one response, rather than failing on just the first one.
 *
 * Verified against @sap/cds source (lib/req/request.js, lib/srv/srv-dispatch.js):
 *   - req.error(code, message, target) pushes onto req._errors WITHOUT throwing.
 *   - After each handler phase, the dispatcher does `if (req.errors) throw req.reject()`,
 *     which auto-fails the request with a 400 and reports every collected error.
 * So calling req.error() per issue and returning normally is the correct,
 * idiomatic pattern -- no manual throw needed here.
 *
 * @param {import('@sap/cds').Request} req
 * @param {import('zod').ZodError} zodError
 */
function reportZodErrors(req, zodError) {
  console.log('IN VALIDATION>>>>', req.data);
  for (const issue of zodError.issues) {
    req.error({
      code: '400',
      message: issue.message,
      target: issue.path.join('.') || undefined,
    });
  }
}

/**
 * Runs a Zod schema against req.data, replaces req.data with the parsed
 * (defaulted/coerced) result on success, or reports all issues via
 * reportZodErrors on failure.
 *
 * @param {import('zod').ZodType} schema
 * @returns {(req: import('@sap/cds').Request) => void}
 */
function validateWith(schema) {
  return (req) => {
    const result = schema.safeParse(req.data);
    if (!result.success) {
      reportZodErrors(req, result.error);
      return;
    }
    Object.assign(req.data, result.data);
  };
}

module.exports = { reportZodErrors, validateWith };
