import express from 'express';
import { getLogsController, getLogByIdController } from '../controllers/operationLogsController';
import { authorizeRole } from '../middlewares/authMiddleware';

const router = express.Router();

/** 操作日志分页查询 */
router.get('/list', authorizeRole('admin', 'superadmin'), getLogsController);

/** 操作日志单条查询（按log_id） */
router.get('/:log_id', authorizeRole('admin', 'superadmin'), getLogByIdController);

export default router;