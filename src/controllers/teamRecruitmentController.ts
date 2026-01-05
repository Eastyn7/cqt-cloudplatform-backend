import { Request, Response } from 'express';
import { submitApply, getAdminPage, reviewStage, assignFinal } from '../services/teamRecruitmentService';
import { getDepartmentApplicants } from '../services/teamRecruitmentService';
import { successResponse, errorResponse, HTTP_STATUS } from '../utils/response';
import { query } from '../db';

/** 学生提交报名 */
export const submitApplyController = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.student_id) {
      errorResponse(res, '未识别的用户身份', HTTP_STATUS.UNAUTHORIZED);
      return;
    }

    const result = await submitApply(user.student_id, req.body);
    successResponse(res, result, '报名提交成功', HTTP_STATUS.CREATED);
  } catch (error: any) {
    errorResponse(res, error.message || '提交失败', error.status || undefined, error);
  }
};

/** 分页查询报名列表 */
export const getAdminPageController = async (req: Request, res: Response) => {
  try {
    const result = await getAdminPage(req.query);
    successResponse(res, result, '查询成功');
  } catch (error: any) {
    errorResponse(res, error.message || '查询失败', error.status || undefined, error);
  }
};

/** 部门管理员查看本部门所有报名 */
export const getDepartmentApplicantsController = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.student_id) {
      errorResponse(res, '未识别的用户身份', HTTP_STATUS.UNAUTHORIZED);
      return;
    }

    const studentId = user.student_id as string;
    const result = await getDepartmentApplicants(studentId, req.query.year as any, req.query);
    successResponse(res, result, '查询成功');
  } catch (error: any) {
    errorResponse(res, error.message || '查询失败', error.status || undefined, error);
  }
};

/** 审核面试结果 */
export const reviewStageController = async (req: Request, res: Response) => {
  try {
    const studentId = (req as any).user?.student_id;
    if (!studentId) {
      errorResponse(res, '身份信息缺失', HTTP_STATUS.UNAUTHORIZED);
      return;
    }

    // 将 student_id 转换为 auth_id（数据库中的主键）
    const [row] = await query(`SELECT auth_id FROM auth_login WHERE student_id = ? LIMIT 1`, [studentId]) as any[];
    const adminId = row?.auth_id;
    if (!adminId) {
      errorResponse(res, '管理员账号不存在或未同步', HTTP_STATUS.UNAUTHORIZED);
      return;
    }

    const result = await reviewStage(adminId, req.body);
    successResponse(res, result, '审核完成');
  } catch (error: any) {
    errorResponse(res, error.message || '审核失败', error.status || undefined, error);
  }
};

/** 最终任命/分配部门 */
export const assignFinalController = async (req: Request, res: Response) => {
  try {
    const studentId = (req as any).user?.student_id;
    if (!studentId) {
      errorResponse(res, '身份信息缺失', HTTP_STATUS.UNAUTHORIZED);
      return;
    }

    // 将 student_id 转换为 auth_id（数据库中的主键）
    const [row] = await query(`SELECT auth_id FROM auth_login WHERE student_id = ? LIMIT 1`, [studentId]) as any[];
    const adminId = row?.auth_id;
    if (!adminId) {
      errorResponse(res, '管理员账号不存在或未同步', HTTP_STATUS.UNAUTHORIZED);
      return;
    }

    const result = await assignFinal(adminId, req.body);
    successResponse(res, result, '任命/分配完成');
  } catch (error: any) {
    errorResponse(res, error.message || '操作失败', error.status || undefined, error);
  }
};

export default {
  submitApplyController,
  getAdminPageController,
  reviewStageController,
  assignFinalController,
};