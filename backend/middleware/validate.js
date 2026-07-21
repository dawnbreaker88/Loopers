import AppError from '../utils/AppError.js';

export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params
    });

    // Assign sanitized data back
    if (parsed.body) req.body = parsed.body;
    if (parsed.query) req.query = parsed.query;
    if (parsed.params) req.params = parsed.params;

    next();
  } catch (error) {
    if (error.errors && Array.isArray(error.errors)) {
      const issueMessages = error.errors.map(err => {
        const path = err.path.slice(1).join('.');
        return `${path ? path + ': ' : ''}${err.message}`;
      }).join('; ');
      return next(new AppError(`Validation Error: ${issueMessages}`, 400));
    }
    return next(new AppError('Invalid request data format', 400));
  }
};
