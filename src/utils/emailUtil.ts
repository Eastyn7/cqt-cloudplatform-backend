import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import dotenv from 'dotenv';
import { Response } from 'express';
import { HTTP_STATUS, successResponse, errorResponse } from './response';

dotenv.config();

/** 创建邮件传输实例（从环境变量加载SMTP配置） */
const transporter = nodemailer.createTransport(
  {
    host: process.env.SMTP_HOST || 'smtp.163.com',
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true,
    auth: {
      type: 'login',
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  } as SMTPTransport.Options
);

/** 获取邮件发送方配置（名称+邮箱） */
const getMailFrom = () => {
  const fromName = process.env.MAIL_FROM_NAME || 'CTBU常青藤';
  const fromEmail = process.env.SMTP_USER;
  return `"${fromName}" <${fromEmail}>`;
};

/** 发送纯文本邮件 */
export const sendEmail = async (to: string, subject: string, text: string): Promise<void> => {
  const mailOptions = { from: getMailFrom(), to, subject, text };

  try {
    const info = await transporter.sendMail(mailOptions);
    if (process.env.NODE_ENV === 'development') {
      console.log('📤 邮件发送成功:', info.response);
    }
  } catch (error: any) {
    console.error('❌ 邮件发送失败:', error.message);
    throw new Error('邮件发送失败，请稍后再试');
  }
};

/** 发送HTML模板邮件 */
export const sendHtmlEmail = async (to: string, subject: string, html: string): Promise<void> => {
  const mailOptions = { from: getMailFrom(), to, subject, html };

  try {
    const info = await transporter.sendMail(mailOptions);
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 邮件发送成功:', info.response);
    }
  } catch (error: any) {
    console.error('❌ 邮件发送失败:', error.message);
    throw new Error('邮件发送失败，请稍后再试');
  }
};

/** 发送邮箱验证码（5分钟有效） */
export const sendVerificationCode = async (to: string, code: string): Promise<void> => {
  const subject = '【CTBU常青藤】邮箱验证码';
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:auto;padding:20px;background-color:#f9f9f9;border-radius:10px;">
      <h2 style="color:#4caf50;">CTBU 常青藤志愿服务平台</h2>
      <p>您好，您的验证码为：</p>
      <p style="font-size:24px;font-weight:bold;color:#4caf50;">${code}</p>
      <p>验证码 5 分钟内有效，请勿泄露给他人。</p>
      <p style="margin-top:30px;color:#999;">此邮件为系统自动发送，请勿回复。</p>
    </div>
  `;
  await sendHtmlEmail(to, subject, html);
};

/** 发送注册欢迎邮件 */
export const sendWelcomeEmail = async (to: string, username: string): Promise<void> => {
  const subject = '🎉 欢迎加入 CTBU 常青藤';
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:auto;padding:20px;background-color:#fefefe;border-radius:10px;">
      <h2 style="color:#4caf50;">欢迎加入 CTBU 常青藤志愿服务平台</h2>
      <p>亲爱的 ${username}：</p>
      <p>欢迎成为我们的一员！感谢您的信任与支持。</p>
      <p>您现在可以登录平台，参与志愿活动、管理任务并查看学业成长记录。</p>
      <p style="margin-top:30px;color:#999;">此邮件为系统自动发送，请勿回复。</p>
    </div>
  `;
  await sendHtmlEmail(to, subject, html);
};

/** 发送密码重置邮件（30分钟有效链接） */
export const sendPasswordResetEmail = async (to: string, resetLink: string): Promise<void> => {
  const subject = '🔑 重置您的 CTBU 常青藤 账户密码';
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:auto;padding:20px;background-color:#fafafa;border-radius:10px;">
      <h2 style="color:#4caf50;">CTBU 常青藤密码重置</h2>
      <p>请点击以下链接重置密码：</p>
      <a href="${resetLink}" style="color:#2196f3;">${resetLink}</a>
      <p>链接 30 分钟内有效，如非本人操作请忽略此邮件。</p>
    </div>
  `;
  await sendHtmlEmail(to, subject, html);
};

/** 发送密码修改成功通知邮件 */
export const sendPasswordChangedEmail = async (to: string, username: string): Promise<void> => {
  const subject = '🔒 您的 CTBU 常青藤账号密码已修改';
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:auto;padding:20px;background:#fafafa;border-radius:10px;">
      <h2 style="color:#4caf50;">CTBU 常青藤安全中心</h2>
      <p>尊敬的学号为 ${username} 的志愿者，您好：</p>
      <p>您的账户密码已于 <b>${new Date().toLocaleString()}</b> 修改成功。</p>
      <p>如果这不是您本人操作，请立即前往平台重置密码或联系管理员处理。</p>
      <p style="margin-top:30px;color:#999;">此邮件为系统自动发送，请勿回复。</p>
    </div>
  `;
  await sendHtmlEmail(to, subject, html);
};

/** 控制器级封装：发送邮件并返回统一响应 */
export const sendEmailWithResponse = async (
  res: Response,
  to: string,
  subject: string,
  html: string
) => {
  try {
    await sendHtmlEmail(to, subject, html);
    return successResponse(res, null, '邮件发送成功', HTTP_STATUS.OK);
  } catch (error: any) {
    return errorResponse(
      res,
      '邮件发送失败，请稍后再试',
      HTTP_STATUS.INTERNAL_ERROR,
      error?.message
    );
  }
};