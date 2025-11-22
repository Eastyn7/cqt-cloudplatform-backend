import jwt, { JwtPayload, Secret } from 'jsonwebtoken';

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'default_secret_key';
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '2h') as any;

export interface TokenPayload extends JwtPayload {
  auth_id: number;
  student_id: string;
  email: string;
  role?: string;
}

/** 生成 JWT */
export const signToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/** 验证 JWT */
export const verifyToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
};