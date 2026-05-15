const { Router } = require('express');
const Product = require('../models/Product');

const router = Router();

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.sponsorId) filter.sponsorId = req.query.sponsorId;
    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error('[products GET]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { sponsorId, name, description, type, image } = req.body;
    if (!sponsorId || !name || !type) {
      return res.status(400).json({ message: 'sponsorId, name e type são obrigatórios.' });
    }
    const product = await Product.create({ sponsorId, name, description, type, image });
    res.status(201).json(product);
  } catch (err) {
    console.error('[products POST]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error('[products DELETE]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
