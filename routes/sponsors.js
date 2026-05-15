const { Router } = require('express');
const Sponsor = require('../models/Sponsor');

const router = Router();

router.get('/', async (req, res) => {
  try {
    const sponsors = await Sponsor.find().sort({ createdAt: -1 });
    res.json(sponsors);
  } catch (err) {
    console.error('[sponsors GET]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const sponsor = await Sponsor.findById(req.params.id);
    if (!sponsor) return res.status(404).json({ message: 'Apoiador não encontrado.' });
    res.json(sponsor);
  } catch (err) {
    console.error('[sponsors GET /:id]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { companyName, cnpj, contactName, email, phone, city, supportType, notes } = req.body;

    if (!companyName || !cnpj || !contactName || !email || !city) {
      return res.status(400).json({ message: 'Preencha todos os campos obrigatórios.' });
    }

    const exists = await Sponsor.findOne({ cnpj });
    if (exists) {
      return res.status(409).json({ message: 'CNPJ já cadastrado.' });
    }

    const { logo } = req.body;
    const sponsor = await Sponsor.create({ companyName, cnpj, contactName, email, phone, city, supportType, notes, logo });
    res.status(201).json(sponsor);
  } catch (err) {
    console.error('[sponsors POST]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id/logo', async (req, res) => {
  try {
    const { logo } = req.body;
    const sponsor = await Sponsor.findByIdAndUpdate(
      req.params.id,
      { logo: logo || null },
      { new: true }
    );
    if (!sponsor) return res.status(404).json({ message: 'Apoiador não encontrado.' });
    res.json({ logo: sponsor.logo });
  } catch (err) {
    console.error('[sponsors PATCH /:id/logo]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
