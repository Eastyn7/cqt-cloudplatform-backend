import { query } from '../db';
import { UmbrellaRental } from '../types/index';

// 创建新的雨伞
export const createUmbrella = async (code: string): Promise<any> => {
  const result = await query<{ insertId: number }>(
    'INSERT INTO umbrella (code) VALUES (?)',
    [code]
  );
  return { id: result.insertId, code, is_borrowed: false };
};

// 删除雨伞
export const deleteUmbrella = async (id: number): Promise<string> => {
  const result = await query<{ affectedRows: number }>(
    'DELETE FROM umbrella WHERE id = ?',
    [id]
  );
  return result.affectedRows > 0 ? '删除成功' : '删除失败';
};

// 借伞
export const borrowUmbrella = async (auth_id: number, code: string): Promise<UmbrellaRental> => {
  // 获取雨伞 id 和借用状态
  const umbrellaResult = await query<[{ id: number, is_borrowed: number }]>(
    'SELECT id, is_borrowed FROM umbrella WHERE code = ?',
    [code]
  );

  if (!umbrellaResult) {
    throw new Error('雨伞编码无效');
  }

  const umbrella = umbrellaResult[0];
  const umbrella_id = umbrella.id;

  // 检查该用户是否已经借用了这把伞
  const existingRental = await query<[{ id: number }]>(
    'SELECT id FROM umbrella_rental WHERE auth_id = ? AND umbrella_id = ? AND is_returned = 0',
    [auth_id, umbrella_id]
  );

  if (existingRental && existingRental.length > 0) {
    // 用户已经借了这把伞，直接返回借伞成功
    return { id: existingRental[0].id, umbrella_id, auth_id, borrow_time: new Date(), return_time: null, is_returned: false };
  }

  // 检查用户是否有其他未归还的雨伞
  const otherUnreturnedUmbrella = await query<[{ id: number }]>(
    'SELECT id FROM umbrella_rental WHERE auth_id = ? AND is_returned = 0',
    [auth_id]
  );

  if (otherUnreturnedUmbrella && otherUnreturnedUmbrella.length > 0) {
    // 如果用户还有未归还的其他伞，提醒用户先归还
    throw new Error('您有未归还的雨伞，请先归还后再借新的雨伞');
  }

  // 检查伞是否已被借出
  if (umbrella.is_borrowed === 1) {
    throw new Error('该雨伞已被借用，无法再次借用');
  }

  // 插入新的借伞记录
  const rentalResult = await query<{ insertId: number }>(
    'INSERT INTO umbrella_rental (umbrella_id, auth_id, borrow_time) VALUES (?, ?, NOW())',
    [umbrella_id, auth_id]
  );

  // 更新伞的借用状态
  await query(
    'UPDATE umbrella SET is_borrowed = 1 WHERE id = ?',
    [umbrella_id]
  );

  return { id: rentalResult.insertId, umbrella_id, auth_id, borrow_time: new Date(), return_time: null, is_returned: false };
};


// 还伞
export const returnUmbrella = async (auth_id: number, code: string): Promise<string> => {
  // 获取雨伞 umbrella_id
  const umbrellaResult = await query<[{ id: number }]>(
    'SELECT id FROM umbrella WHERE code = ?',
    [code]
  );

  if (!umbrellaResult) {
    throw new Error('雨伞编码无效');
  }

  const umbrella_id = umbrellaResult[0].id;

  // 检查用户是否借了这把伞
  const rentalRecord = await query<[{ id: number }]>(
    'SELECT id FROM umbrella_rental WHERE auth_id = ? AND umbrella_id = ? AND is_returned = 0',
    [auth_id, umbrella_id]
  );

  if (!rentalRecord) {
    throw new Error('用户没有借用这把伞，无法还伞');
  }

  // 更新租赁记录
  const rentalResult = await query<{ affectedRows: number }>(
    'UPDATE umbrella_rental SET return_time = NOW(), is_returned = 1 WHERE auth_id = ? AND umbrella_id = ? AND is_returned = 0',
    [auth_id, umbrella_id]
  );

  // 更新伞的借用状态
  await query(
    'UPDATE umbrella SET is_borrowed = 0 WHERE id = ?',
    [umbrella_id]
  );

  return rentalResult.affectedRows > 0 ? '还伞成功' : '未找到未归还的借伞记录';
};


// 获取用户借伞记录
export const getUserUmbrellaRecords = async (auth_id: number): Promise<UmbrellaRental[]> => {
  return query<UmbrellaRental[]>('SELECT * FROM umbrella_rental WHERE auth_id = ?', [auth_id]);
};

// 获取所有借伞记录（仅管理员）
export const getAllUmbrellaRecords = async (): Promise<UmbrellaRental[]> => {
  return query<UmbrellaRental[]>('SELECT * FROM umbrella_rental');
};
