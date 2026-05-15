const { Router } = require('express');
const SponsorRequest = require('../models/SponsorRequest');

const router = Router();

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.sponsorId) filter.sponsorId = req.query.sponsorId;
    if (req.query.userId)    filter.userId    = req.query.userId;
    const requests = await SponsorRequest.find(filter).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error('[sponsor-requests GET]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { sponsorId, productId, productName, companyName, userId, userName, userContact, message } = req.body;

    if (!sponsorId || !productId || !productName || !userName || !userContact) {
      return res.status(400).json({ message: 'Preencha todos os campos obrigatórios.' });
    }

    const request = await SponsorRequest.create({
      sponsorId, productId, productName, companyName, userId, userName, userContact, message,
    });
    res.status(201).json(request);
  } catch (err) {
    console.error('[sponsor-requests POST]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    const update = { status };
    if (status === 'contacted') update.contactedAt = new Date();
    if (status === 'resolved')  update.resolvedAt  = new Date();

    const request = await SponsorRequest.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );
    if (!request) return res.status(404).json({ message: 'Requisição não encontrada.' });
    res.json(request);
  } catch (err) {
    console.error('[sponsor-requests PATCH]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
