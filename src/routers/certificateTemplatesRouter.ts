import express from 'express';
import { authorizeRole } from '../middlewares/authMiddleware';
import {
  createCertificateTemplateController,
  getCertificateTemplatesPageController,
  getCertificateTemplatesListController,
  getCertificateTemplateByIdController,
  updateCertificateTemplateController,
  activateCertificateTemplateController,
  deleteCertificateTemplateController,
} from '../controllers/certificateTemplatesController';
import {
  validateCertificateTemplateCreate,
  validateCertificateTemplateUpdate,
} from '../validators/validateRequest';

const router = express.Router();

router.post('/create', authorizeRole('admin', 'superadmin'), validateCertificateTemplateCreate, createCertificateTemplateController);
router.get('/page', authorizeRole('admin', 'superadmin'), getCertificateTemplatesPageController);
router.get('/list', authorizeRole('admin', 'superadmin'), getCertificateTemplatesListController);
router.put('/activate/:template_id', authorizeRole('admin', 'superadmin'), activateCertificateTemplateController);
router.put('/update/:template_id', authorizeRole('admin', 'superadmin'), validateCertificateTemplateUpdate, updateCertificateTemplateController);
router.delete('/delete/:template_id', authorizeRole('admin', 'superadmin'), deleteCertificateTemplateController);
router.get('/:template_id', authorizeRole('admin', 'superadmin'), getCertificateTemplateByIdController);

export default router;
