import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.163.com',
  port: 465,
  secure: true,
  auth: {
    type: 'login',
    user: 'ctbuchangqingteng@163.com',
    pass: 'YQjTkM3aQv2qvzC2' // 授权码
  }
});


/**
 * 发送邮件
 * @param to 收件人邮箱
 * @param subject 邮件主题
 * @param html 邮件内容（HTML格式）
 */
export const sendEmail = async (to: string, subject: string, html: string) => {
  const mailOptions = {
    from: '"CTBU AI常青藤青队" <ctbuchangqingteng@163.com>',
    to,
    subject,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('邮件发送成功');
  } catch (error) {
    console.error('邮件发送失败:', error);
    throw new Error('邮件发送失败');
  }
};
