import express from 'express';
import { authorizeRole } from '../middlewares/authMiddleware';
import {
  getServiceHoursEligibilityController,
  generateServiceCertificateController,
  previewServiceCertificateController,
  getServiceCertificatesPageController,
  getServiceCertificateDownloadController,
  revokeServiceCertificateController,
  getEnabledCertificateTemplatesController,
  getCertificateTemplateDownloadController,
} from '../controllers/serviceCertificatesController';
import { validateServiceCertificateGenerate } from '../validators/validateRequest';

const router = express.Router();

router.get('/service-hours/eligibility', authorizeRole('user', 'admin', 'superadmin'), getServiceHoursEligibilityController);
router.get('/service-hours/preview', authorizeRole('user', 'admin', 'superadmin'), previewServiceCertificateController);
router.post('/service-hours/generate', authorizeRole('user', 'admin', 'superadmin'), validateServiceCertificateGenerate, generateServiceCertificateController);
router.get('/service-hours/list', authorizeRole('user', 'admin', 'superadmin'), getServiceCertificatesPageController);
router.get('/service-hours/download/:cert_id', authorizeRole('user', 'admin', 'superadmin'), getServiceCertificateDownloadController);
router.put('/service-hours/revoke/:cert_id', authorizeRole('admin', 'superadmin'), revokeServiceCertificateController);

router.get('/templates/list', authorizeRole('admin', 'superadmin'), getEnabledCertificateTemplatesController);
router.get('/templates/download/:template_id', authorizeRole('admin', 'superadmin'), getCertificateTemplateDownloadController);

export default router;
