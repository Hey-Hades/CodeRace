// backend/routes/user.route.js
import express from 'express';
import { getLeaderboard, getUserProfile } from '../controllers/user.controller.js';

const router = express.Router();

router.get('/leaderboard', getLeaderboard);
router.get('/:id', getUserProfile);

export default router;