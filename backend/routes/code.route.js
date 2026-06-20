import express from 'express';
// 1. Import the new function we created
import { executeCode } from '../controllers/code.controller.js';

const router = express.Router();

// 2. Map it to the exact endpoint your Race.jsx frontend is hitting
router.post('/execute', executeCode);
export default router;