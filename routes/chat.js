const { Router } = require('express');
const Match   = require('../models/Match');
const Message = require('../models/Message');
const auth    = require('../middleware/auth');

const router = Router();

// Verifica se o utilizador é participante do match (helper ou quem pediu ajuda)
async function assertParticipant(matchId, userId, res) {
  const match = await Match.findById(matchId).populate('requestId', 'userId');
  if (!match) {
    res.status(404).json({ message: 'Match not found' });
    return null;
  }

  const isHelper    = match.helperId.toString() === userId;
  const isRequester = match.requestId.userId.toString() === userId;

  if (!isHelper && !isRequester) {
    res.status(403).json({ message: 'Forbidden' });
    return null;
  }

  return match;
}

// GET /chat/:matchId — busca todas as mensagens do match
router.get('/:matchId', auth, async (req, res) => {
  try {
    const match = await assertParticipant(req.params.matchId, req.userId, res);
    if (!match) return;

    const messages = await Message.find({ matchId: req.params.matchId })
      .populate('senderId', 'name nickname')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error('[chat]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /chat/:matchId — envia uma mensagem
router.post('/:matchId', auth, async (req, res) => {
  try {
    const match = await assertParticipant(req.params.matchId, req.userId, res);
    if (!match) return;

    const { text } = req.body;
    if (!text?.trim()) {
      return res.status(400).json({ message: 'text is required' });
    }

    const message = await Message.create({
      matchId:  req.params.matchId,
      senderId: req.userId,
      text:     text.trim(),
    });

    await message.populate('senderId', 'name nickname');

    res.status(201).json(message);
  } catch (err) {
    console.error('[chat]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
