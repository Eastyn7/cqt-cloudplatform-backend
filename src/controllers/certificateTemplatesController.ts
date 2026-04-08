import { Request, Response } from 'express';
import { successResponse, errorResponse } from '../utils/response';
import {
  createCertificateTemplate,
  getCertificateTemplatesPage,
  getCertificateTemplatesList,
  getCertificateTemplateById,
  updateCertificateTemplate,
  activateCertificateTemplate,
  deleteCertificateTemplate,
} from '../services/certificateTemplatesService';

export const createCertificateTemplateController = async (req: Request, res: Response) => {
  try {
    const result = await createCertificateTemplate(req.body);
    successResponse(res, result, '创建模板成功');
  } catch (err: any) {
    errorResponse(res, err.message, err.status);
  }
};

export const getCertificateTemplatesPageController = async (req: Request, res: Response) => {
  try {
    const result = await getCertificateTemplatesPage(req.query as any);
    successResponse(res, result, '获取模板分页成功');
  } catch (err: any) {
    errorResponse(res, err.message, err.status);
  }
};

export const getCertificateTemplatesListController = async (req: Request, res: Response) => {
  try {
    const result = await getCertificateTemplatesList(req.query as any);
    successResponse(res, result, '获取模板列表成功');
  } catch (err: any) {
    errorResponse(res, err.message, err.status);
  }
};

export const getCertificateTemplateByIdController = async (req: Request, res: Response) => {
  try {
    const templateId = Number(req.params.template_id);
    const result = await getCertificateTemplateById(templateId);
    successResponse(res, result, '获取模板详情成功');
  } catch (err: any) {
    errorResponse(res, err.message, err.status);
  }
};

export const updateCertificateTemplateController = async (req: Request, res: Response) => {
  try {
    const templateId = Number(req.params.template_id);
    const result = await updateCertificateTemplate(templateId, req.body);
    successResponse(res, result, '更新模板成功');
  } catch (err: any) {
    errorResponse(res, err.message, err.status);
  }
};

export const deleteCertificateTemplateController = async (req: Request, res: Response) => {
  try {
    const templateId = Number(req.params.template_id);
    const result = await deleteCertificateTemplate(templateId);
    successResponse(res, result, '删除模板成功');
  } catch (err: any) {
    errorResponse(res, err.message, err.status);
  }
};

export const activateCertificateTemplateController = async (req: Request, res: Response) => {
  try {
    const templateId = Number(req.params.template_id);
    const result = await activateCertificateTemplate(templateId);
    successResponse(res, result, '启用模板成功（同用途旧模板已自动禁用）');
  } catch (err: any) {
    errorResponse(res, err.message, err.status);
  }
};
