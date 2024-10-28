import { sendEmail } from './src/utils/emailSender';

const testSendEmail = async () => {
  try {
    console.log("正在发送邮件");
    
    await sendEmail('939285542@qq.com', '测试测试', '爱你爱你爱你');
  } catch (error) {
    console.error('测试发送邮件时出错:', error);
  }
};

testSendEmail();
