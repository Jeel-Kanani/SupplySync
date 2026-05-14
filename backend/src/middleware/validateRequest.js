export const validateRequest = (validator) => (req, _res, next) => {
  try {
    validator(req);
    next();
  } catch (error) {
    next(error);
  }
};
