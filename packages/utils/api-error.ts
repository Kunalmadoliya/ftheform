export class ApiError extends Error {
  public statusCode: number;
  public success: boolean;
  public errors: unknown[];
  public isOperational: boolean;

  constructor(
    statusCode: number,
    message: string,
    errors: unknown[] = [],
    stack?: string
  ) {
    super(message);

    this.statusCode = statusCode;
    this.success = false;
    this.errors = errors;
    this.isOperational = true;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  // 4xx Client Errors
  static badRequest(msg = "Bad request", errors: unknown[] = []) {
    return new ApiError(400, msg, errors);
  }

  static unauthorized(msg = "Authentication required") {
    return new ApiError(401, msg);
  }

  static forbidden(msg = "Forbidden") {
    return new ApiError(403, msg);
  }

  static notFound(msg = "Resource not found") {
    return new ApiError(404, msg);
  }

  static methodNotAllowed(msg = "Method not allowed") {
    return new ApiError(405, msg);
  }

  static conflict(msg = "Resource conflict") {
    return new ApiError(409, msg);
  }

  static validationError(
    msg = "Validation failed",
    errors: unknown[] = []
  ) {
    return new ApiError(422, msg, errors);
  }

  static tooManyRequests(msg = "Too many requests") {
    return new ApiError(429, msg);
  }

  // 5xx Server Errors
  static internal(msg = "Internal server error") {
    return new ApiError(500, msg);
  }

  static notImplemented(msg = "Not implemented") {
    return new ApiError(501, msg);
  }

  static badGateway(msg = "Bad gateway") {
    return new ApiError(502, msg);
  }

  static serviceUnavailable(msg = "Service unavailable") {
    return new ApiError(503, msg);
  }

  static gatewayTimeout(msg = "Gateway timeout") {
    return new ApiError(504, msg);
  }
}