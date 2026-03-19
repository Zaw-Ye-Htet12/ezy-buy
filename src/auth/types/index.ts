import { Role } from '@prisma/client';

export type Tokens = {
  access_token: string;
  refresh_token: string;
};

export type JwtPayload = {
  sub: string;
  email: string;
  role: string;
};

export type JwtPayloadWithRt = JwtPayload & { refreshToken: string };

export type UserResponse = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: Role;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: Date;
};

export type AuthResponse = {
  user: UserResponse;
  tokens: Tokens;
  message?: string;
};
