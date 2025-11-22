import { Request, Response } from 'express';
import { getOperationLogs, getOperationLogById } from '../services/operationLogsService';
import { successResponse, errorResponse } from '../utils/response';

/** 操作日志分页列表（后台用） */
export const getLogsController = async (req: Request, res: Response) => {
  try {
    const result = await getOperationLogs(req.query);
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message, err.status);
  }
};

/** 操作日志单条详情（按log_id查询） */
export const getLogByIdController = async (req: Request, res: Response) => {
  try {
    const { log_id } = req.params;
    const result = await getOperationLogById(Number(log_id));
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message, err.status);
  }
};