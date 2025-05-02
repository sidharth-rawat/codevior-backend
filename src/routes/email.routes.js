import express from 'express';
import { sendEmailController } from '../controllers/email.controller.js';

const router = express.Router();

/**
 * @route POST /api/send-email
 * @desc Send an email with data from request body
 * @access Public
 */
router.post('/send-email', sendEmailController);

export default router;
