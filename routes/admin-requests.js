const { Router } = require('express');
const Request  = require('../models/Request');
const Match    = require('../models/Match');
const ThankYou = require('../models/ThankYou');
const User     = require('../models/User');
const adminAuth = require('../middleware/admin-auth');

const router = Router();

// GET /admin/requests?status=&skip=&limit=
router.get('/', adminAuth, async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const skip  = parseInt(req.query.skip) || 0;

    const [requests, total] = await Promise.all([
      Request.find(filter)
        .populate('userId', 'name nickname email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Request.countDocuments(filter),
    ]);

    // Attach match summary to each request
    const ids = requests.map(r => r._id);
    const matches = ids.length
      ? await Match.find({ requestId: { $in: ids } }).select('requestId status helperId')
          .populate('helperId', 'name nickname')
      : [];

    const matchMap = {};
    for (const m of matches) {
      const key = m.requestId.toString();
      if (!matchMap[key]) matchMap[key] = [];
      matchMap[key].push({ status: m.status, helper: m.helperId });
    }

    const result = requests.map(r => ({
      ...r.toObject(),
      matches: matchMap[r._id.toString()] || [],
    }));

    res.json({ requests: result, total });
  } catch (err) {
    console.error('[GET /admin/requests]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/*
 * Cancel a request and all its dependencies.
 *
 * Status map:
 *   Match pending              → cancelled (no side effects)
 *   Match active               → cancelled (no side effects)
 *   Match awaiting_confirmation→ cancelled (no side effects)
 *   Match completed            → cancelled + decrement helpReceived/helpGiven + delete ThankYou
 *   Match cancelled            → skip (already done)
 *
 *   Request → cancelled
 */
router.patch('/:id/cancel', adminAuth, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Pedido não encontrado' });
    if (request.status === 'cancelled') {
      return res.status(400).json({ message: 'Pedido já está cancelado' });
    }

    const matches = await Match.find({ requestId: request._id });

    let matchesCancelled = 0;
    let countersReverted = 0;
    let thankYousRemoved = 0;

    for (const match of matches) {
      if (match.status === 'cancelled') continue;

      if (match.status === 'completed') {
        await User.findByIdAndUpdate(request.userId,  { $inc: { helpReceived: -1 } });
        await User.findByIdAndUpdate(match.helperId,  { $inc: { helpGiven:    -1 } });
        countersReverted++;

        const removed = await ThankYou.deleteMany({ matchId: match._id });
        thankYousRemoved += removed.deletedCount;
      }

      match.status = 'cancelled';
      await match.save();
      matchesCancelled++;
    }

    request.status = 'cancelled';
    await request.save();

    res.json({ ok: true, matchesCancelled, countersReverted, thankYousRemoved });
  } catch (err) {
    console.error('[PATCH /admin/requests/:id/cancel]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
