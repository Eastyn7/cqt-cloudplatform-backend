import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();
const SECRET_KEY = process.env.JWT_SECRET || 'ctbuCQTSecret';

export const generateToken = (payload: object, expiresIn: number = 43200): string => {
  return 'Bearer ' + jwt.sign(payload, SECRET_KEY, { expiresIn });
};

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (error) {
    return null;
  }
};