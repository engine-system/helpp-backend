const { Router } = require('express');
const GoodAction = require('../models/GoodAction');
const auth = require('../middleware/auth');

const router = Router();

router.get('/', async (req, res) => {
  try {
    const actions = await GoodAction.find()
      .populate('userId', 'name nickname city')
      .sort({ createdAt: -1 });

    res.json(actions);
  } catch (err) {
    console.error('[good-actions]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { description, photoUrl } = req.body;

    if (!description) {
      return res.status(400).json({ message: 'description is required' });
    }

    const action = await GoodAction.create({
      userId: req.userId,
      description,
      photoUrl: photoUrl || null,
    });

    res.status(201).json(action);
  } catch (err) {
    console.error('[good-actions]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
