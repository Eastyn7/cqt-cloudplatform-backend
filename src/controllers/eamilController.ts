import { successResponse, errorResponse } from '../utils/responseUtil';
import { Request, Response } from 'express';
import { sendEmail } from '../services/emailService';

const verificationCodes = new Map<string, { code: string; expiry: number }>();

// 发送验证码
export const sendVerificationCode = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  if (!email) {
    return errorResponse(res, '邮箱不能为空', 400);
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = Date.now() + 2 * 60 * 1000; // 2分钟后过期
  verificationCodes.set(email, { code, expiry });

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
      <h2 style="color: #333;">欢迎来到 CTBU AI常青藤青队云平台!</h2>
      <p>亲爱的用户，</p>
      <p>感谢您注册我们的服务！为了验证您的身份，请使用以下验证码：</p>
      <h3 style="background-color: #f8f8f8; padding: 10px; border-radius: 5px; text-align: center; font-size: 24px; color: #1989fa;">
        ${code}
      </h3>
      <p>请注意，验证码将在 2 分钟内过期。请尽快输入以完成您的注册。</p>
      <p>如果您没有请求此验证码，请忽略此邮件。</p>
      <p>谢谢！</p>
      <p>CTBU AI常青藤青队</p>
    </div>
  `;

  try {
    await sendEmail(email, '验证码', htmlContent);
    console.log(verificationCodes);
    successResponse(res, null, '验证码已发送', 200);
  } catch (error) {
    console.error('邮件发送失败:', error);
    errorResponse(res, '邮件发送失败', 500);
  }
};


// 验证验证码
export const verifyCode = (email: string, code: string): boolean => {
  const storedData = verificationCodes.get(email);
  if (storedData) {
    const { code: storedCode, expiry } = storedData;
    const isExpired = Date.now() > expiry;

    if (isExpired) {
      verificationCodes.delete(email); // 删除过期的验证码
      return false; // 验证失败，验证码已过期
    }

    if (storedCode === code) {
      verificationCodes.delete(email); // 验证成功后删除验证码
      return true; // 验证成功
    }
  }
  return false; // 验证失败
};
