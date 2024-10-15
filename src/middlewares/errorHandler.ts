import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/responseUtil';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  errorResponse(res, err.message || 'Server error', 500);
};
