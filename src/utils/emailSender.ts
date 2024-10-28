import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.163.com',
  // service: '163',
  port: 465,
  secure: true,
  auth: {
    type: 'login',
    user: 'ctbuchangqingteng@163.com',
    pass: 'YQjTkM3aQv2qvzC2' // 请使用授权码
  }
});

/**
 * 发送邮件
 * @param to 收件人邮箱
 * @param subject 邮件主题
 * @param text 邮件内容
 */
export const sendEmail = async (to: string, subject: string, text: string) => {  
  const mailOptions = {
    from: '"CTBU常青藤" <ctbuchangqingteng@163.com>',
    to,
    subject,
    text,
  };


  try {
    const result = await transporter.sendMail(mailOptions);
    console.log(result);
    
    console.log('邮件发送成功');
  } catch (error) {
    console.error('邮件发送失败:', error);
  }
};
