export const sendSuccess = (res, statusCode, data) => {
  res.status(statusCode).json({
    success: true,
    data
  });
};
