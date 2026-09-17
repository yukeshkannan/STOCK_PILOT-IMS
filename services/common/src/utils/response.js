const ApiResponse = {
  success(res, data = null, message = 'Success', statusCode = 200, meta = null) {
    const response = {
      success: true,
      message,
      data
    };
    if (meta) response.meta = meta;
    return res.status(statusCode).json(response);
  },

  created(res, data = null, message = 'Resource created successfully', meta = null) {
    return this.success(res, data, message, 201, meta);
  },

  paginated(res, data = [], page = 1, limit = 50, total = 0, message = 'Retrieved successfully') {
    const currentPage = parseInt(page, 10) || 1;
    const pageLimit = parseInt(limit, 10) || 50;
    const totalCount = parseInt(total, 10) || (Array.isArray(data) ? data.length : 0);
    const totalPages = Math.ceil(totalCount / pageLimit) || 1;

    const response = {
      success: true,
      message,
      data,
      pagination: {
        page: currentPage,
        limit: pageLimit,
        total: totalCount,
        totalPages
      },
      meta: {
        page: currentPage,
        limit: pageLimit,
        total: totalCount,
        totalPages
      }
    };

    return res.status(200).json(response);
  },

  error(res, message = 'Internal Server Error', statusCode = 500, errors = null) {
    const response = {
      success: false,
      message
    };
    if (errors) response.errors = errors;
    return res.status(statusCode).json(response);
  },

  badRequest(res, message = 'Bad Request', errors = null) {
    return this.error(res, message, 400, errors);
  },

  unauthorized(res, message = 'Unauthorized') {
    return this.error(res, message, 401);
  },

  forbidden(res, message = 'Forbidden') {
    return this.error(res, message, 403);
  },

  notFound(res, message = 'Resource not found') {
    return this.error(res, message, 404);
  },

  conflict(res, message = 'Conflict') {
    return this.error(res, message, 409);
  },

  serverError(res, message = 'Internal Server Error', errors = null) {
    return this.error(res, message, 500, errors);
  },

  noContent(res) {
    return res.status(204).send();
  }
};

function sendSuccess(res, data, message = 'Success', statusCode = 200, meta = null) {
  return ApiResponse.success(res, data, message, statusCode, meta);
}

function sendError(res, message = 'Internal Server Error', statusCode = 500, errors = null) {
  return ApiResponse.error(res, message, statusCode, errors);
}

module.exports = {
  ApiResponse,
  sendSuccess,
  sendError
};
