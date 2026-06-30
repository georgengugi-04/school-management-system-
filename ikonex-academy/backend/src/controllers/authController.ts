import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { generateTokens, verifyRefreshToken } from '../utils/jwt';
import { sendSuccess, sendError, sendUnauthorized } from '../utils/response';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.isActive) {
      return sendUnauthorized(res, 'Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendUnauthorized(res, 'Invalid email or password');
    }

    const tokens = generateTokens(user);

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'LOGIN',
        entity: 'User',
        entityId: user.id,
        description: `User ${user.email} logged in`,
        userId: user.id,
        ipAddress: req.ip,
      },
    });

    return sendSuccess(res, {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
      },
      ...tokens,
    }, 'Login successful');
  } catch (error) {
    return sendError(res, 'Login failed', 500);
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return sendError(res, 'Refresh token required');
    }

    const payload = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId, isActive: true },
    });

    if (!user) {
      return sendUnauthorized(res, 'Invalid refresh token');
    }

    const tokens = generateTokens(user);
    return sendSuccess(res, tokens, 'Token refreshed successfully');
  } catch (error) {
    return sendUnauthorized(res, 'Invalid or expired refresh token');
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    });

    if (!user) {
      return sendUnauthorized(res, 'User not found');
    }

    return sendSuccess(res, user);
  } catch (error) {
    return sendError(res, 'Failed to fetch user', 500);
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return sendUnauthorized(res);

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return sendError(res, 'Current password is incorrect');

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });

    return sendSuccess(res, null, 'Password changed successfully');
  } catch (error) {
    return sendError(res, 'Failed to change password', 500);
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    await prisma.activityLog.create({
      data: {
        action: 'LOGOUT',
        entity: 'User',
        entityId: req.user?.userId,
        description: `User ${req.user?.email} logged out`,
        userId: req.user?.userId,
        ipAddress: req.ip,
      },
    });

    return sendSuccess(res, null, 'Logged out successfully');
  } catch (error) {
    return sendError(res, 'Logout failed', 500);
  }
};
