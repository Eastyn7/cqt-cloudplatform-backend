// 封装统一的响应格式
import { Response } from 'express';

interface ResponseFormat {
  success: boolean;
  message: string;
  data?: any;
}

export const successResponse = (res: Response, data: any, message = 'Success', statusCode = 200) => {
  const response: ResponseFormat = {
    success: true,
    message,
    data
  };
  res.status(statusCode).json(response);
};

export const errorResponse = (res: Response, message: string, statusCode = 500) => {
  const response: ResponseFormat = {
    success: false,
    message
  };
  res.status(statusCode).json(response);
};
