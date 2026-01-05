import express from 'express';
import {
  createAnnouncementController,
  updateAnnouncementController,
  deleteAnnouncementController,
  getAllAnnouncementsController,
  getAnnouncementsPageController,
} from '../controllers/announcementsController';
import { authorizeRole } from '../middlewares/authMiddleware';
import { validateAnnouncementCreate, validateAnnouncementUpdate } from '../validators/validateRequest';

const router = express.Router();

// 创建公告
router.post('/create', authorizeRole('admin', 'superadmin'), validateAnnouncementCreate, createAnnouncementController);

// 更新公告
router.put('/update/:announcement_id', authorizeRole('admin', 'superadmin'), validateAnnouncementUpdate, updateAnnouncementController);

// 删除公告
router.delete('/delete/:announcement_id', authorizeRole('admin', 'superadmin'), deleteAnnouncementController);

// 获取全部公告
router.get('/list', authorizeRole('admin', 'superadmin'), getAllAnnouncementsController);

// 分页查询公告
router.get('/page', authorizeRole('admin', 'superadmin'), getAnnouncementsPageController);

export default router;