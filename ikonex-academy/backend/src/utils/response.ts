import { Response } from 'express';

export const sendSuccess = (
  res: Response,
  data: any,
  message = 'Success',
  statusCode = 200
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

export const sendCreated = (res: Response, data: any, message = 'Created successfully') => {
  return sendSuccess(res, data, message, 201);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 400,
  errors?: any
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
    timestamp: new Date().toISOString(),
  });
};

export const sendNotFound = (res: Response, message = 'Resource not found') => {
  return sendError(res, message, 404);
};

export const sendUnauthorized = (res: Response, message = 'Unauthorized') => {
  return sendError(res, message, 401);
};

export const sendForbidden = (res: Response, message = 'Forbidden') => {
  return sendError(res, message, 403);
};

export const sendConflict = (res: Response, message = 'Conflict') => {
  return sendError(res, message, 409);
};

export const paginate = (page: number, limit: number) => {
  const parsedPage = Math.max(1, parseInt(String(page)) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(String(limit)) || 10));
  const skip = (parsedPage - 1) * parsedLimit;
  return { skip, take: parsedLimit, page: parsedPage, limit: parsedLimit };
};

export const paginatedResponse = (
  data: any[],
  total: number,
  page: number,
  limit: number
) => ({
  data,
  pagination: {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  },
});
