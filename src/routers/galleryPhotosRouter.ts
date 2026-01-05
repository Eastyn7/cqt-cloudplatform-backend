import express from 'express';
import {
  createPhotoController,
  updatePhotoController,
  deletePhotoController,
  getAllPhotosController
} from '../controllers/galleryPhotosController';
import { authorizeRole } from '../middlewares/authMiddleware';
import { validateGalleryPhotoCreate, validateGalleryPhotoUpdate } from '../validators/validateRequest';

const router = express.Router();

// 后台创建照片
router.post('/create', authorizeRole('admin', 'superadmin'), validateGalleryPhotoCreate, createPhotoController);

// 后台更新照片
router.put('/update/:photo_id', authorizeRole('admin', 'superadmin'), validateGalleryPhotoUpdate, updatePhotoController);

// 删除照片
router.delete('/delete/:photo_id', authorizeRole('admin', 'superadmin'), deletePhotoController);

// 后台照片列表
router.get('/page', authorizeRole('admin', 'superadmin'), getAllPhotosController);

export default router;