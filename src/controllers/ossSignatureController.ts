import { Request, Response } from 'express';
import { generateOSSPolicy } from '../services/ossSignatureService';
import { successResponse, errorResponse } from '../utils/response';

export const getOSSSignature = async (req: Request, res: Response) => {
  try {
    const { dir } = req.body;
    const result = generateOSSPolicy(dir as string || 'uploads/');
    successResponse(res, result, 'success');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};