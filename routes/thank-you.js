const { Router } = require('express');
const ThankYou = require('../models/ThankYou');
const auth = require('../middleware/auth');

const router = Router();

// GET /thank-you — feed público (sem audioBase64, paginado)
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const skip  = Number(req.query.skip) || 0;

    const [messages, total] = await Promise.all([
      ThankYou.find({ isPublic: true })
        .select('-audioBase64')
        .populate('fromUserId', 'name nickname avatar')
        .populate('toUserId',   'name nickname')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ThankYou.countDocuments({ isPublic: true }),
    ]);

    res.json({ messages, total, skip, limit });
  } catch (err) {
    console.error('[thank-you]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /thank-you/received — agradecimentos recebidos (público + privado) do usuário autenticado
router.get('/received', auth, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const skip  = Number(req.query.skip) || 0;

    const [messages, total] = await Promise.all([
      ThankYou.find({ toUserId: req.userId })
        .select('-audioBase64')
        .populate('fromUserId', 'name nickname avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ThankYou.countDocuments({ toUserId: req.userId }),
    ]);

    res.json({ messages, total, skip, limit });
  } catch (err) {
    console.error('[thank-you/received]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /thank-you/:id — registro completo (com áudio se houver)
router.get('/:id', async (req, res) => {
  try {
    const entry = await ThankYou.findById(req.params.id)
      .populate('fromUserId', 'name nickname avatar')
      .populate('toUserId',   'name nickname');

    if (!entry) return res.status(404).json({ message: 'Not found' });
    if (!entry.isPublic) return res.status(403).json({ message: 'Private' });

    res.json(entry);
  } catch (err) {
    console.error('[thank-you/:id]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /thank-you — criar agradecimento
router.post('/', auth, async (req, res) => {
  try {
    const { toUserId, matchId, message, audioBase64, isPublic } = req.body;

    if (!toUserId || !matchId) {
      return res.status(400).json({ message: 'toUserId and matchId are required' });
    }

    const entry = await ThankYou.create({
      fromUserId:  req.userId,
      toUserId,
      matchId,
      message:     message || '',
      audioBase64: audioBase64 || undefined,
      isPublic:    isPublic !== false,        // default true
      hasAudio:    !!audioBase64,
    });

    res.status(201).json(entry);
  } catch (err) {
    console.error('[thank-you]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
