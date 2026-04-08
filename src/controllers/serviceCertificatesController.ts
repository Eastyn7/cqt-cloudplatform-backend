import { Request, Response } from 'express';
import { successResponse, errorResponse } from '../utils/response';
import {
  getServiceHoursEligibility,
  generateServiceCertificate,
  getServiceCertificatesPage,
  getServiceCertificateDownload,
  previewServiceCertificate,
  revokeServiceCertificate,
} from '../services/serviceCertificatesService';
import {
  getEnabledCertificateTemplatesForUser,
  getCertificateTemplateDownloadUrl,
} from '../services/certificateTemplatesService';

export const getServiceHoursEligibilityController = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      errorResponse(res, '未登录或身份信息丢失', 401);
      return;
    }

    const queryStudentId = req.query.student_id ? String(req.query.student_id) : undefined;
    const studentId = user.role === 'user' ? String(user.student_id) : (queryStudentId || String(user.student_id));
    const templateId = req.query.template_id ? Number(req.query.template_id) : undefined;

    const result = await getServiceHoursEligibility(studentId, templateId);
    successResponse(res, result, '获取资格校验成功');
  } catch (err: any) {
    errorResponse(res, err.message, err.status);
  }
};

export const generateServiceCertificateController = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      errorResponse(res, '未登录或身份信息丢失', 401);
      return;
    }

    const bodyStudentId = req.body.student_id ? String(req.body.student_id) : undefined;
    const studentId = user.role === 'user' ? String(user.student_id) : (bodyStudentId || String(user.student_id));

    const templateId = req.body.template_id ? Number(req.body.template_id) : undefined;
    const payload = req.body.payload || {};

    const result = await generateServiceCertificate(studentId, templateId, payload, String(user.student_id));
    successResponse(res, result, '生成证书成功');
  } catch (err: any) {
    errorResponse(res, err.message, err.status);
  }
};

export const previewServiceCertificateController = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      errorResponse(res, '未登录或身份信息丢失', 401);
      return;
    }

    const queryStudentId = req.query.student_id ? String(req.query.student_id) : undefined;
    const studentId = user.role === 'user' ? String(user.student_id) : (queryStudentId || String(user.student_id));
    const templateId = req.query.template_id ? Number(req.query.template_id) : undefined;

    const result = await previewServiceCertificate(studentId, templateId, String(user.student_id));
    successResponse(res, result, '生成预览成功');
  } catch (err: any) {
    errorResponse(res, err.message, err.status);
  }
};

export const getServiceCertificatesPageController = async (req: Request, res: Response) => {
  try {
    const result = await getServiceCertificatesPage(req.query as any, req.user);
    successResponse(res, result, '获取证书列表成功');
  } catch (err: any) {
    errorResponse(res, err.message, err.status);
  }
};

export const getServiceCertificateDownloadController = async (req: Request, res: Response) => {
  try {
    const certId = Number(req.params.cert_id);
    const result = await getServiceCertificateDownload(certId, req.user);
    successResponse(res, result, '获取下载地址成功');
  } catch (err: any) {
    errorResponse(res, err.message, err.status);
  }
};

export const revokeServiceCertificateController = async (req: Request, res: Response) => {
  try {
    const certId = Number(req.params.cert_id);
    const reason = req.body?.reason ? String(req.body.reason) : '';
    const result = await revokeServiceCertificate(certId, req.user, reason);
    successResponse(res, result, '作废证书成功');
  } catch (err: any) {
    errorResponse(res, err.message, err.status);
  }
};

export const getEnabledCertificateTemplatesController = async (_req: Request, res: Response) => {
  try {
    const result = await getEnabledCertificateTemplatesForUser();
    successResponse(res, result, '获取可用模板成功');
  } catch (err: any) {
    errorResponse(res, err.message, err.status);
  }
};

export const getCertificateTemplateDownloadController = async (req: Request, res: Response) => {
  try {
    const templateId = Number(req.params.template_id);
    const result = await getCertificateTemplateDownloadUrl(templateId);
    successResponse(res, result, '获取模板下载地址成功');
  } catch (err: any) {
    errorResponse(res, err.message, err.status);
  }
};
