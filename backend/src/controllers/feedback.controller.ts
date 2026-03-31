import { Request, Response } from 'express';
import Feedback from '../models/Feedback';
import { analyzeFeedback } from '../services/gemini.service';

// POST /api/feedback
export const createFeedback = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      title,
      description,
      category,
      submitterName,
      submitterEmail,
    } = req.body;

    // Input validation
    if (!title || !description || !category) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Title, description and category are required',
        data: null,
      });
      return;
    }

    if (title.length > 120) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Title cannot exceed 120 characters',
        data: null,
      });
      return;
    }

    if (description.length < 20) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Description must be at least 20 characters',
        data: null,
      });
      return;
    }

    const validCategories = ['Bug', 'Feature Request', 'Improvement', 'Other'];
    if (!validCategories.includes(category)) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Invalid category',
        data: null,
      });
      return;
    }

    // Save feedback first
    const feedback = await Feedback.create({
      title: title.trim(),
      description: description.trim(),
      category,
      submitterName: submitterName?.trim(),
      submitterEmail: submitterEmail?.trim(),
    });

    // Run Gemini analysis after saving
    const analysis = await analyzeFeedback(title, description);

    if (analysis) {
      feedback.ai_category = analysis.category;
      feedback.ai_sentiment = analysis.sentiment;
      feedback.ai_priority = analysis.priority_score;
      feedback.ai_summary = analysis.summary;
      feedback.ai_tags = analysis.tags;
      feedback.ai_processed = true;
      await feedback.save();
    }

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      error: null,
      data: feedback,
    });
  } catch (error) {
    console.error('Create feedback error:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Something went wrong',
      data: null,
    });
  }
};

// GET /api/feedback
export const getAllFeedback = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      category,
      status,
      sort = 'createdAt',
      order = 'desc',
      page = '1',
      limit = '10',
      search,
    } = req.query;

    // Build filter
    const filter: Record<string, unknown> = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { ai_summary: { $regex: search, $options: 'i' } },
      ];
    }

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Sort
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortField = sort as string;

    const [feedbacks, total] = await Promise.all([
      Feedback.find(filter)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limitNum),
      Feedback.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      message: 'Feedback fetched successfully',
      error: null,
      data: {
        feedbacks,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Something went wrong',
      data: null,
    });
  }
};

// GET /api/feedback/:id
export const getFeedbackById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Feedback not found',
        data: null,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Feedback fetched successfully',
      error: null,
      data: feedback,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Something went wrong',
      data: null,
    });
  }
};

// PATCH /api/feedback/:id
export const updateFeedbackStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { status } = req.body;
    const validStatuses = ['New', 'In Review', 'Resolved'];

    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Valid status is required (New, In Review, Resolved)',
        data: null,
      });
      return;
    }

    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!feedback) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Feedback not found',
        data: null,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      error: null,
      data: feedback,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Something went wrong',
      data: null,
    });
  }
};

// DELETE /api/feedback/:id
export const deleteFeedback = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);

    if (!feedback) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Feedback not found',
        data: null,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Feedback deleted successfully',
      error: null,
      data: null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Something went wrong',
      data: null,
    });
  }
};

// GET /api/feedback/summary
export const getAISummary = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentFeedbacks = await Feedback.find({
      createdAt: { $gte: sevenDaysAgo },
      ai_processed: true,
    }).limit(20);

    if (recentFeedbacks.length === 0) {
      res.status(200).json({
        success: true,
        message: 'No recent feedback to summarise',
        error: null,
        data: { summary: 'No feedback received in the last 7 days.' },
      });
      return;
    }

    const { analyzeFeedback: analyzeWithGemini } = await import(
      '../services/gemini.service'
    );

    const feedbackText = recentFeedbacks
      .map((f) => `- ${f.title}: ${f.ai_summary || f.description}`)
      .join('\n');

    const summary = await analyzeWithGemini(
      'Weekly Summary Request',
      `Summarise these feedbacks and identify top 3 themes:\n${feedbackText}`
    );

    res.status(200).json({
      success: true,
      message: 'Summary generated successfully',
      error: null,
      data: { summary },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Something went wrong',
      data: null,
    });
  }
};

// POST /api/feedback/:id/reanalyze
export const reanalyzeFeedback = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Feedback not found',
        data: null,
      });
      return;
    }

    const analysis = await analyzeFeedback(
      feedback.title,
      feedback.description
    );

    if (!analysis) {
      res.status(500).json({
        success: false,
        error: 'AI Error',
        message: 'Failed to reanalyze feedback',
        data: null,
      });
      return;
    }

    feedback.ai_category = analysis.category;
    feedback.ai_sentiment = analysis.sentiment;
    feedback.ai_priority = analysis.priority_score;
    feedback.ai_summary = analysis.summary;
    feedback.ai_tags = analysis.tags;
    feedback.ai_processed = true;
    await feedback.save();

    res.status(200).json({
      success: true,
      message: 'Feedback reanalyzed successfully',
      error: null,
      data: feedback,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Something went wrong',
      data: null,
    });
  }
};