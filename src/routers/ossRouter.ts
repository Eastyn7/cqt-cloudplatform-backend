import express from 'express';
import { getOSSSignature } from '../controllers/ossSignatureController';

const router = express.Router();

/** 获取OSS直传签名 */
router.post('/signature', getOSSSignature);

export default router;