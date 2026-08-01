const sendSuccess = (
  res,
  {
    statusCode = 200,
    message = "Request completed successfully",
    data = {},
    meta = {},
  }
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    meta,
  });
};

module.exports = {
  sendSuccess,
};
