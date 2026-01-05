import express from 'express';
import { getSTS } from '../controllers/stsController';

const router = express.Router();

/** 获取 OSS 上传用的 STS 临时凭证 */
router.get('/sts', getSTS);

export default router;