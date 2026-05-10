export const validateSchema = (schema) => {
  return async (req, res, next) => {
    try {
      const parsed = await schema.parseAsync(req.body);
      req.body = parsed;
      next();
    } catch (error) {
      const fieldErrors = {};
      error.errors.forEach(err => {
        const path = err.path.join('.');
        fieldErrors[path] = err.message;
      });
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: fieldErrors,
      });
    }
  };
};
