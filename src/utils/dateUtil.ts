/** 格式化时间为 "yyyy-MM-dd HH:mm:ss" 格式 */
export const formatDateTime = (date: Date | string | number): string => {
  const d = new Date(date);
  const pad = (n: number) => (n < 10 ? '0' + n : n); // 数字补零（确保单 digit 转为双 digit）

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

/** 获取当前秒级时间戳（向下取整） */
export const nowTimestamp = (): number => Math.floor(Date.now() / 1000);