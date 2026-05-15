const express = require('express');
const router = express.Router();
const Review = require('../models/Review');

// GET /reviews/:userId?limit=20&skip=0
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const skip  = parseInt(req.query.skip) || 0;

  try {
    const [reviews, total] = await Promise.all([
      Review.find({ toUserId: userId })
        .populate('fromUserId', 'name nickname avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments({ toUserId: userId }),
    ]);

    res.json({ reviews, total, skip, limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro interno.' });
  }
});

module.exports = router;
