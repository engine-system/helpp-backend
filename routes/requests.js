const { Router } = require('express');
const Request = require('../models/Request');
const Match = require('../models/Match');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = Router();

router.get('/mine', auth, async (req, res) => {
  try {
    const requests = await Request.find({ userId: req.userId })
      .sort({ createdAt: -1 });

    const relevantIds = requests.map((r) => r._id);

    const matches = relevantIds.length
      ? await Match.find({
          requestId: { $in: relevantIds },
          status: { $in: ['active', 'pending', 'awaiting_confirmation', 'completed', 'cancelled'] },
        }).populate('helperId', 'name nickname')
      : [];

    // Group matches by requestId
    const matchesByRequest = {};
    for (const m of matches) {
      const key = m.requestId.toString();
      if (!matchesByRequest[key]) matchesByRequest[key] = [];
      matchesByRequest[key].push(m);
    }

    const result = requests.map((r) => {
      const plain = r.toObject();
      const rMatches = matchesByRequest[r._id.toString()] || [];

      // Active or awaiting_confirmation match → expose matchId + helper
      const active = rMatches.find((m) => m.status === 'active' || m.status === 'awaiting_confirmation');
      if (active) {
        plain.matchId     = active._id;
        plain.matchStatus = active.status;
        plain.helper      = active.helperId;
      }

      // Completed match → expose matchId + proofImage for history view
      const completed = rMatches.find((m) => m.status === 'completed');
      if (completed) {
        plain.matchId     = completed._id;
        plain.matchStatus = completed.status;
        plain.helper      = completed.helperId;
        plain.proofImage  = completed.proofImage || null;
      }

      // Pending offers → requester can accept or decline
      plain.offers = rMatches
        .filter((m) => m.status === 'pending')
        .map((m) => ({
          matchId:      m._id,
          helper:       m.helperId,
          offerMessage: m.offerMessage,
          createdAt:    m.createdAt,
        }));

      return plain;
    });

    res.json(result);
  } catch (err) {
    console.error('[requests/mine]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.userId)   filter.userId = req.query.userId;
    if (!req.query.userId)  filter.status = 'pending';

    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip  = parseInt(req.query.skip)  || 0;

    const requests = await Request.find(filter)
      .populate('userId', 'name nickname city neighborhood')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit);

    res.json(requests);
  } catch (err) {
    console.error('[requests]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('userId', 'name nickname city neighborhood');

    if (!request) return res.status(404).json({ message: 'Request not found' });

    res.json(request);
  } catch (err) {
    console.error('[requests]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { category, reason, urgency, giveBack, latitude, longitude } = req.body;

    if (!category || !reason || !urgency || !giveBack) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const user = await User.findById(req.userId);
    if (user && user.helpReceived > user.helpGiven) {
      return res.status(403).json({
        code: 'obligation_pending',
        helpReceived: user.helpReceived,
        helpGiven: user.helpGiven,
      });
    }

    const data = { userId: req.userId, category, reason, urgency, giveBack };
    if (latitude != null && longitude != null) {
      data.latitude  = latitude;
      data.longitude = longitude;
    }

    const request = await Request.create(data);
    await request.populate('userId', 'name nickname city neighborhood');

    res.status(201).json(request);
  } catch (err) {
    console.error('[requests]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id', auth, async (req, res) => {
  try {
    const { status } = req.body;

    const allowed = ['pending', 'matched', 'completed', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (request.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    request.status = status;
    await request.save();

    res.json(request);
  } catch (err) {
    console.error('[requests]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
