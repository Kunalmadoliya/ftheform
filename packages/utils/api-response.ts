import type { Response } from "express";

export class ApiResponse {
  static send<T>(
    res: Response,
    statusCode: number,
    message: string,
    data?: T
  ) {
    return res.status(statusCode).json({
      success: true,
      message,
      data: data ?? null,
    });
  }

  static ok<T>(res: Response, message = "Request successful", data?: T) {
    return this.send(res, 200, message, data);
  }

  static created<T>(
    res: Response,
    message = "Resource created successfully",
    data?: T
  ) {
    return this.send(res, 201, message, data);
  }

  static accepted<T>(
    res: Response,
    message = "Request accepted",
    data?: T
  ) {
    return this.send(res, 202, message, data);
  }

  static noContent(res: Response) {
    return res.status(204).send();
  }

  static resetContent(res: Response) {
    return this.send(res, 205, "Reset content");
  }

  static partialContent<T>(
    res: Response,
    message = "Partial content",
    data?: T
  ) {
    return this.send(res, 206, message, data);
  }
}