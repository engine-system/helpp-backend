const { Router } = require('express');
const PostTemplate = require('../models/PostTemplate');

const router = Router();

// GET by sponsorId (admin + app)
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.sponsorId) filter.sponsorId = req.query.sponsorId;
    const templates = await PostTemplate.find(filter).sort({ createdAt: -1 });
    res.json(templates);
  } catch (err) {
    console.error('[post-templates GET]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST create
router.post('/', async (req, res) => {
  try {
    const { sponsorId, image, caption } = req.body;
    if (!sponsorId) return res.status(400).json({ message: 'sponsorId é obrigatório.' });
    if (!image && !caption) return res.status(400).json({ message: 'Informe imagem ou texto.' });
    const template = await PostTemplate.create({ sponsorId, image, caption });
    res.status(201).json(template);
  } catch (err) {
    console.error('[post-templates POST]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH update
router.patch('/:id', async (req, res) => {
  try {
    const { image, caption } = req.body;
    const update = {};
    if (image   !== undefined) update.image   = image;
    if (caption !== undefined) update.caption = caption;
    const template = await PostTemplate.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!template) return res.status(404).json({ message: 'Template não encontrado.' });
    res.json(template);
  } catch (err) {
    console.error('[post-templates PATCH]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    await PostTemplate.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error('[post-templates DELETE]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
