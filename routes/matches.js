const { Router } = require('express');
const Match = require('../models/Match');
const Request = require('../models/Request');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = Router();

router.get('/mine', auth, async (req, res) => {
  try {
    const matches = await Match.find({ helperId: req.userId })
      .populate({ path: 'requestId', populate: { path: 'userId', select: 'name nickname city neighborhood' } })
      .sort({ createdAt: -1 });

    res.json(matches);
  } catch (err) {
    console.error('[matches/mine]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.helperId)  filter.helperId  = req.query.helperId;
    if (req.query.requestId) filter.requestId = req.query.requestId;
    if (req.query.status)    filter.status    = req.query.status;

    const matches = await Match.find(filter)
      .populate('requestId')
      .populate('helperId', 'name nickname city')
      .sort({ createdAt: -1 });

    res.json(matches);
  } catch (err) {
    console.error('[matches]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper sends an offer → status starts as 'pending'
router.post('/', auth, async (req, res) => {
  try {
    const { requestId, offerMessage } = req.body;

    if (!requestId) {
      return res.status(400).json({ message: 'requestId is required' });
    }

    // Block if request already has an active helper
    const existingActive = await Match.findOne({ requestId, status: 'active' });
    if (existingActive) {
      return res.status(409).json({ message: 'Request already has an active helper' });
    }

    // Block duplicate offer from the same helper
    const existingOffer = await Match.findOne({ requestId, helperId: req.userId, status: 'pending' });
    if (existingOffer) {
      return res.status(409).json({ message: 'You already sent an offer for this request' });
    }

    const match = await Match.create({ requestId, helperId: req.userId, offerMessage, status: 'pending' });

    res.status(201).json(match);
  } catch (err) {
    console.error('[matches]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Requester approves/declines an offer; helper can cancel an active match
router.patch('/:id', auth, async (req, res) => {
  try {
    const { status } = req.body;

    const match = await Match.findById(req.params.id).populate('requestId');
    if (!match) return res.status(404).json({ message: 'Match not found' });

    const isHelper    = match.helperId.toString() === req.userId;
    const isRequester = match.requestId.userId.toString() === req.userId;

    if (!isHelper && !isRequester) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Requester approves a pending offer → active
    if (isRequester && status === 'active' && match.status === 'pending') {
      match.status = 'active';
      await match.save();
      await Request.findByIdAndUpdate(match.requestId._id, { status: 'matched' });
      // Cancel all other pending offers for this request
      await Match.updateMany(
        { requestId: match.requestId._id, status: 'pending', _id: { $ne: match._id } },
        { status: 'cancelled' }
      );
      return res.json(match);
    }

    // Requester declines a pending offer → cancelled
    if (isRequester && status === 'cancelled' && match.status === 'pending') {
      match.status = 'cancelled';
      await match.save();
      return res.json(match);
    }

    // Helper cancels an active match → cancelled + revert request to pending
    if (isHelper && status === 'cancelled' && match.status === 'active') {
      match.status = 'cancelled';
      await match.save();
      await Request.findByIdAndUpdate(match.requestId._id, { status: 'pending' });
      return res.json(match);
    }

    // Helper signals help was given → awaiting requester confirmation
    if (isHelper && status === 'awaiting_confirmation' && match.status === 'active') {
      const { proofImage } = req.body;
      if (proofImage) match.proofImage = proofImage;
      match.status = 'awaiting_confirmation';
      await match.save();
      return res.json(match);
    }

    // Requester confirms received help (with optional proof photo) → completed
    if (isRequester && status === 'completed' && (match.status === 'active' || match.status === 'awaiting_confirmation')) {
      const { proofImage } = req.body;
      if (proofImage) match.proofImage = proofImage;
      match.status = 'completed';
      await match.save();
      await Request.findByIdAndUpdate(match.requestId._id, { status: 'completed' });
      await User.findByIdAndUpdate(match.requestId.userId, { $inc: { helpReceived: 1 } });
      await User.findByIdAndUpdate(match.helperId, { $inc: { helpGiven: 1 } });
      return res.json(match);
    }

    // Helper cancels the awaiting_confirmation (help didn't happen) → back to active
    if (isHelper && status === 'active' && match.status === 'awaiting_confirmation') {
      match.status = 'active';
      await match.save();
      return res.json(match);
    }

    // Helper marks active match as completed (direct, without confirmation flow)
    if (isHelper && status === 'completed' && match.status === 'active') {
      match.status = 'completed';
      await match.save();
      await Request.findByIdAndUpdate(match.requestId._id, { status: 'completed' });
      await User.findByIdAndUpdate(match.requestId.userId, { $inc: { helpReceived: 1 } });
      await User.findByIdAndUpdate(match.helperId, { $inc: { helpGiven: 1 } });
      return res.json(match);
    }

    return res.status(400).json({ message: 'Invalid status transition' });
  } catch (err) {
    console.error('[matches]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update or delete proof image (only the participant who uploaded it, or either party)
router.patch('/:id/proof', auth, async (req, res) => {
  try {
    const match = await Match.findById(req.params.id).populate('requestId');
    if (!match) return res.status(404).json({ message: 'Match not found' });

    const isRequester = match.requestId.userId.toString() === req.userId;

    if (!isRequester) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // proofImage: base64 string to set, or null/empty to clear
    match.proofImage = req.body.proofImage || null;
    await match.save();

    res.json({ proofImage: match.proofImage });
  } catch (err) {
    console.error('[matches/proof]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
