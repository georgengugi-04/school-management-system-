import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export const generateTokens = (user: Partial<User>) => {
  const payload: JWTPayload = {
    userId: user.id!,
    email: user.email!,
    role: user.role!,
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions);

  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' } as jwt.SignOptions
  );

  return { accessToken, refreshToken };
};

export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { userId: string };
};
