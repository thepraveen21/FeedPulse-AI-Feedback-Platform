import { Router } from 'express';
import {
  createFeedback,
  getAllFeedback,
  getFeedbackById,
  updateFeedbackStatus,
  deleteFeedback,
  getAISummary,
  reanalyzeFeedback,
} from '../controllers/feedback.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/', createFeedback);

// Admin protected routes
router.get('/', protect, getAllFeedback);
router.get('/summary', protect, getAISummary);
router.get('/:id', protect, getFeedbackById);
router.patch('/:id', protect, updateFeedbackStatus);
router.delete('/:id', protect, deleteFeedback);
router.post('/:id/reanalyze', protect, reanalyzeFeedback);

export default router;