import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../utils/jwt';
import prisma from '../config/database';
import { sendUnauthorized, sendForbidden } from '../utils/response';
import { Role } from '@prisma/client';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendUnauthorized(res, 'Access token required');
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId, isActive: true },
    });

    if (!user) {
      return sendUnauthorized(res, 'User not found or inactive');
    }

    req.user = payload;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return sendUnauthorized(res, 'Access token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      return sendUnauthorized(res, 'Invalid access token');
    }
    return sendUnauthorized(res, 'Authentication failed');
  }
};

export const authorize = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendUnauthorized(res);
    }

    if (!roles.includes(req.user.role as Role)) {
      return sendForbidden(res, 'Insufficient permissions');
    }

    next();
  };
};

export const isAdmin = authorize(Role.SUPER_ADMIN, Role.ADMIN);
export const isSuperAdmin = authorize(Role.SUPER_ADMIN);
