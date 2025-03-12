import { Router } from 'express';
import { authorizeRole } from '../middlewares/authenticationMiddleware'
import { borrowUmbrella, returnUmbrella, getUserUmbrellaRecords, getAllUmbrellaRecords } from '../controllers/umbrellaController';

const router = Router();

// 借伞
router.post('/borrow', borrowUmbrella);

// 还伞
router.post('/return', returnUmbrella);

// 获取用户借伞记录
router.post('/user-records', getUserUmbrellaRecords);

// 获取所有借伞记录（仅管理员）
router.post('/all-records', authorizeRole('1', '2'), getAllUmbrellaRecords);

export default router;
