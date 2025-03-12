import { query } from '../db';
import { UmbrellaRental } from '../types/index';

// 借伞
export const borrowUmbrella = async (authId: number): Promise<UmbrellaRental> => {
  const result = await query<{ insertId: number }>(
    'INSERT INTO umbrella_rental (auth_id, borrow_time) VALUES (?, NOW())',
    [authId]
  );
  return { id: result.insertId, auth_id: authId, borrow_time: new Date(), return_time: null, is_returned: false };
};

// 还伞
export const returnUmbrella = async (authId: number): Promise<string> => {
  const result = await query<{ affectedRows: number }>(
    'UPDATE umbrella_rental SET return_time = NOW(), is_returned = TRUE WHERE auth_id = ? AND is_returned = FALSE',
    [authId]
  );
  return result.affectedRows > 0 ? '还伞成功' : '未找到未归还的借伞记录';
};

// 获取用户借伞记录
export const getUserUmbrellaRecords = async (authId: number): Promise<UmbrellaRental[]> => {
  return query<UmbrellaRental[]>('SELECT * FROM umbrella_rental WHERE auth_id = ?', [authId]);
};

// 获取所有借伞记录（仅管理员）
export const getAllUmbrellaRecords = async (): Promise<UmbrellaRental[]> => {
  return query<UmbrellaRental[]>('SELECT * FROM umbrella_rental');
};
