const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Match = require('../models/Match');
const VentSession = require('../models/VentSession');
const User = require('../models/User');
const Review = require('../models/Review');

// POST /ratings
// Body: { toUserId, score (1-5), sourceType ('match'|'vent'), sourceId, text? }
router.post('/', auth, async (req, res) => {
  const fromUserId = req.userId;
  const { toUserId, score, sourceType, sourceId, text, audioBase64 } = req.body;

  if (!toUserId || !score || !sourceType || !sourceId) {
    return res.status(400).json({ message: 'toUserId, score, sourceType e sourceId são obrigatórios.' });
  }

  const numScore = Number(score);
  if (!Number.isInteger(numScore) || numScore < 1 || numScore > 5) {
    return res.status(400).json({ message: 'Score deve ser um inteiro de 1 a 5.' });
  }

  if (!['match', 'vent'].includes(sourceType)) {
    return res.status(400).json({ message: 'sourceType deve ser "match" ou "vent".' });
  }

  try {
    if (sourceType === 'match') {
      const match = await Match.findById(sourceId).populate('requestId');
      if (!match) return res.status(404).json({ message: 'Match não encontrado.' });
      if (match.status !== 'completed') return res.status(400).json({ message: 'Match ainda não foi concluído.' });

      const requesterId = match.requestId.userId.toString();
      const helperId = match.helperId.toString();

      const isRequester = fromUserId === requesterId;
      const isHelper = fromUserId === helperId;

      if (!isRequester && !isHelper) {
        return res.status(403).json({ message: 'Você não é participante deste match.' });
      }

      if (isHelper) {
        if (match.ratedByHelper) return res.status(409).json({ message: 'Você já avaliou esta interação.' });
        await Match.findByIdAndUpdate(sourceId, { ratedByHelper: true });
        await User.findByIdAndUpdate(toUserId, { $inc: { requesterRatingSum: numScore, requesterRatingCount: 1 } });
      }

      if (isRequester) {
        if (match.ratedByRequester) return res.status(409).json({ message: 'Você já avaliou esta interação.' });
        await Match.findByIdAndUpdate(sourceId, { ratedByRequester: true });
        await User.findByIdAndUpdate(toUserId, { $inc: { helperRatingSum: numScore, helperRatingCount: 1 } });
      }
    }

    if (sourceType === 'vent') {
      const session = await VentSession.findById(sourceId);
      if (!session) return res.status(404).json({ message: 'Sessão não encontrada.' });
      if (session.status !== 'ended') return res.status(400).json({ message: 'Sessão ainda não foi encerrada.' });

      const ventUserId = session.ventUserId.toString();
      const helperId = session.helperId.toString();

      const isVentUser = fromUserId === ventUserId;
      const isHelper = fromUserId === helperId;

      if (!isVentUser && !isHelper) {
        return res.status(403).json({ message: 'Você não é participante desta sessão.' });
      }

      if (isHelper) {
        if (session.ratedByHelper) return res.status(409).json({ message: 'Você já avaliou esta sessão.' });
        await VentSession.findByIdAndUpdate(sourceId, { ratedByHelper: true });
        await User.findByIdAndUpdate(toUserId, { $inc: { requesterRatingSum: numScore, requesterRatingCount: 1 } });
      }

      if (isVentUser) {
        if (session.ratedByVentUser) return res.status(409).json({ message: 'Você já avaliou esta sessão.' });
        await VentSession.findByIdAndUpdate(sourceId, { ratedByVentUser: true });
        await User.findByIdAndUpdate(toUserId, { $inc: { helperRatingSum: numScore, helperRatingCount: 1 } });
      }
    }

    // Salva o review com comentário (ignora erro de duplicata)
    try {
      await Review.create({
        fromUserId,
        toUserId,
        sourceType,
        sourceId,
        score: numScore,
        text: text?.trim() || '',
        audioBase64: audioBase64 || undefined,
      });
    } catch (dupErr) {
      if (dupErr.code !== 11000) throw dupErr;
    }

    return res.json({ message: 'Avaliação registrada com sucesso.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro interno.' });
  }
});

module.exports = router;
