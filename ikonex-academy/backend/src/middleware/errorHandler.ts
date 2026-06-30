import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Error:', err);

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const fields = (err.meta?.target as string[])?.join(', ') || 'field';
      return res.status(409).json({
        success: false,
        message: `A record with this ${fields} already exists`,
        timestamp: new Date().toISOString(),
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Record not found',
        timestamp: new Date().toISOString(),
      });
    }
    if (err.code === 'P2003') {
      return res.status(400).json({
        success: false,
        message: 'Invalid reference: related record not found',
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      success: false,
      message: 'Invalid data provided',
      timestamp: new Date().toISOString(),
    });
  }

  // App errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      timestamp: new Date().toISOString(),
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      timestamp: new Date().toISOString(),
    });
  }

  // Default server error
  const isDev = process.env.NODE_ENV === 'development';
  return res.status(500).json({
    success: false,
    message: isDev ? err.message : 'An internal server error occurred',
    stack: isDev ? err.stack : undefined,
    timestamp: new Date().toISOString(),
  });
};
