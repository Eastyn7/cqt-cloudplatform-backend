import { Request, Response, NextFunction } from "express";
import { errorResponse, HTTP_STATUS } from "../utils/response";
import { FieldRule } from "./validateSchemas";

/**
 * 创建数据校验器（支持Express中间件和同步对象校验）
 * @param schema 校验规则配置
 * @param mode 校验模式（create：必填校验；update：未传字段跳过）
 */
export const createValidator = (
  schema: Record<string, FieldRule>,
  mode: "create" | "update" = "create"
) => {

  /**
   * 同步校验任意对象
   * @param data 待校验数据
   * @returns 错误信息（null表示校验通过）
   */
  const syncValidate = (data: any): string | null => {
    const body = data || {};

    for (const field in schema) {
      const rule = schema[field];
      const value = body[field];

      // 1. 创建模式下必填校验
      if (
        mode === "create" &&
        rule.required &&
        (value === undefined || value === null || value === "")
      ) {
        return `${field}: ${rule.message}`;
      }

      // 2. 更新模式下未传字段跳过
      if (mode === "update" && value === undefined) continue;

      // 3. 类型校验
      if (rule.type === "number" && value !== undefined && isNaN(Number(value))) {
        return `${field}: 必须为数字`;
      }
      if (rule.type === "date" && value && isNaN(Date.parse(value))) {
        return `${field}: 日期格式错误`;
      }
      if (rule.type === "enum" && value && !rule.enumValues!.includes(value)) {
        return `${field}: ${rule.message}`;
      }

      // 4. 自定义校验规则
      if (rule.validator && value !== undefined && !rule.validator(value)) {
        return `${field}: ${rule.message}`;
      }
    }

    return null; // 校验通过
  };

  /**
   * Express中间件：校验请求体
   */
  const middleware = (req: Request, res: Response, next: NextFunction) => {
    const error = syncValidate(req.body);
    if (error) {
      errorResponse(res, error, HTTP_STATUS.BAD_REQUEST);
      return;
    }
    next();
  };

  // 挂载同步校验方法到中间件上，支持灵活使用
  return Object.assign(middleware, { syncValidate });
};

/**
 * 创建批量数据校验器（校验数组类型请求体）
 * @param schema 单条数据校验规则
 * @param mode 校验模式（create/update）
 * @returns Express中间件（返回具体错误数据索引）
 */
export const createBatchValidator = (
  schema: Record<string, FieldRule>,
  mode: "create" | "update" = "create"
) => {
  const validator = createValidator(schema, mode);

  return (req: Request, res: Response, next: NextFunction) => {
    const arr = req.body;

    // 先校验是否为非空数组
    if (!Array.isArray(arr) || arr.length === 0) {
      errorResponse(res, "请求体必须为非空数组", HTTP_STATUS.BAD_REQUEST);
      return;
    }

    // 逐条校验，返回具体错误索引
    for (let i = 0; i < arr.length; i++) {
      const errorMsg = validator.syncValidate(arr[i]);
      if (errorMsg) {
        errorResponse(
          res,
          `第 ${i + 1} 条数据错误：${errorMsg}`,
          HTTP_STATUS.BAD_REQUEST
        );
        return;
      }
    }

    next();
  };
};