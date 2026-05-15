const { Router } = require('express');
const VentQueue   = require('../models/VentQueue');
const VentSession = require('../models/VentSession');
const VentMessage = require('../models/VentMessage');
const User        = require('../models/User');
const auth = require('../middleware/auth');

const router = Router();

// Entra na fila (ou retorna posição se já estiver)
router.post('/queue', auth, async (req, res) => {
  try {
    let entry = await VentQueue.findOne({ userId: req.userId });

    if (!entry) {
      entry = await VentQueue.create({ userId: req.userId, status: 'waiting' });
    }

    const position = await VentQueue.countDocuments({
      status: 'waiting',
      _id: { $lte: entry._id },
    });

    res.status(201).json({ _id: entry._id, status: entry.status, position });
  } catch (err) {
    console.error('[vent/queue POST]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Consulta posição atual na fila
router.get('/queue/me', auth, async (req, res) => {
  try {
    const entry = await VentQueue.findOne({ userId: req.userId });

    if (!entry) {
      return res.status(404).json({ message: 'Not in queue' });
    }

    const position = await VentQueue.countDocuments({
      status: 'waiting',
      _id: { $lte: entry._id },
    });

    let sessionId;
    if (entry.status === 'matched') {
      const session = await VentSession.findOne({ ventUserId: req.userId, status: 'active' });
      if (session) sessionId = session._id;
    }

    res.json({ _id: entry._id, status: entry.status, position, sessionId });
  } catch (err) {
    console.error('[vent/queue GET]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Contagem de pessoas na fila (sem auth — usado para exibir o banner no app)
router.get('/queue/count', async (req, res) => {
  try {
    const count = await VentQueue.countDocuments({ status: 'waiting' });
    res.json({ count });
  } catch (err) {
    console.error('[vent/queue/count]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Sai da fila
router.delete('/queue', auth, async (req, res) => {
  try {
    await VentQueue.deleteOne({ userId: req.userId });
    res.json({ message: 'Left queue' });
  } catch (err) {
    console.error('[vent/queue DELETE]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper aceita a primeira pessoa da fila → cria VentSession
router.post('/match', auth, async (req, res) => {
  try {
    // Garante que o helper não tem sessão ativa
    const existing = await VentSession.findOne({ helperId: req.userId, status: 'active' });
    if (existing) {
      return res.status(409).json({ message: 'You already have an active vent session', sessionId: existing._id });
    }

    // Pega o primeiro da fila (mais antigo)
    const next = await VentQueue.findOne({ status: 'waiting' }).sort({ _id: 1 });
    if (!next) {
      return res.status(404).json({ message: 'No one in queue' });
    }

    // Marca como matched e cria a sessão
    next.status = 'matched';
    await next.save();

    const session = await VentSession.create({
      ventUserId: next.userId,
      helperId:   req.userId,
    });

    res.status(201).json({ sessionId: session._id, ventUserId: next.userId });
  } catch (err) {
    console.error('[vent/match]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Busca sessão ativa do usuário (como ventUser ou helper)
router.get('/session/mine', auth, async (req, res) => {
  try {
    const session = await VentSession.findOne({
      status: 'active',
      $or: [{ ventUserId: req.userId }, { helperId: req.userId }],
    });

    if (!session) return res.status(404).json({ message: 'No active session' });

    res.json(session);
  } catch (err) {
    console.error('[vent/session/mine]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Encerra a sessão
router.patch('/session/:id/end', auth, async (req, res) => {
  try {
    const session = await VentSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const isParticipant =
      session.ventUserId.toString() === req.userId ||
      session.helperId.toString() === req.userId;

    if (!isParticipant) return res.status(403).json({ message: 'Forbidden' });

    session.status = 'ended';
    await session.save();

    await User.findByIdAndUpdate(session.helperId,   { $inc: { helpGiven:    1 } });
    await User.findByIdAndUpdate(session.ventUserId, { $inc: { helpReceived: 1 } });
    await VentQueue.deleteOne({ userId: session.ventUserId });

    res.json(session);
  } catch (err) {
    console.error('[vent/session/end]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Busca mensagens de uma sessão
router.get('/chat/:sessionId', auth, async (req, res) => {
  try {
    const session = await VentSession.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const isParticipant =
      session.ventUserId.toString() === req.userId ||
      session.helperId.toString() === req.userId;

    if (!isParticipant) return res.status(403).json({ message: 'Forbidden' });

    const messages = await VentMessage.find({ sessionId: req.params.sessionId })
      .populate('senderId', 'name nickname')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error('[vent/chat GET]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Envia mensagem numa sessão
router.post('/chat/:sessionId', auth, async (req, res) => {
  try {
    const session = await VentSession.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const isParticipant =
      session.ventUserId.toString() === req.userId ||
      session.helperId.toString() === req.userId;

    if (!isParticipant) return res.status(403).json({ message: 'Forbidden' });

    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'text is required' });

    const message = await VentMessage.create({
      sessionId: req.params.sessionId,
      senderId:  req.userId,
      text:      text.trim(),
    });

    await message.populate('senderId', 'name nickname');

    res.status(201).json(message);
  } catch (err) {
    console.error('[vent/chat POST]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
