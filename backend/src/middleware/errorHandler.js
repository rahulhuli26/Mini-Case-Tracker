/**
 * Express error-handling middleware. Translates MongoDB duplicate-key errors
 * (code `11000`) into a 409 response and otherwise returns the error's
 * status code (or 500) with its message. Stack traces are omitted when
 * `NODE_ENV` is `'production'`.
 *
 * @param {Error & {code?: number}} err - The error thrown/passed to `next()`.
 * @param {import('express').Request} req - Incoming request.
 * @param {import('express').Response} res - Outgoing response.
 * @param {import('express').NextFunction} next - Next middleware (unused, required for Express to treat this as an error handler).
 * @returns {void}
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  if (err?.code === 11000) {
    return res.status(409).json({
      message: 'Data already exists.'
    });
  }

  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
};
