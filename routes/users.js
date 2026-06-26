const { Router } = require('express');
const User = require('../models/User');
const Report = require('../models/Report');
const Match = require('../models/Match');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

const router = Router();

router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('[users]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id', auth, async (req, res) => {
  try {
    if (req.userId !== req.params.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { nickname, cpfSuffix, phoneSuffix, city, neighborhood, latitude, longitude, avatar } = req.body;

    const update = { nickname, cpfSuffix, phoneSuffix, city, neighborhood, profileComplete: true };
    if (latitude != null && longitude != null) {
      update.latitude  = parseFloat(Number(latitude).toFixed(2));
      update.longitude = parseFloat(Number(longitude).toFixed(2));
    }
    if (avatar !== undefined) {
      update.avatar = avatar;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (err) {
    console.error('[users]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Public: request account deletion by email (for App Store / web form)
router.post('/delete-request', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'E-mail é obrigatório.' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // Return 200 to avoid user enumeration
      return res.json({ message: 'Se o e-mail existir, a solicitação foi registrada.' });
    }

    await deleteUserData(user._id);
    res.json({ message: 'Conta e dados excluídos com sucesso.' });
  } catch (err) {
    console.error('[users/delete-request]', err);
    res.status(500).json({ message: 'Erro ao processar solicitação.' });
  }
});

// Authenticated: delete own account from within the app
router.delete('/me', auth, async (req, res) => {
  try {
    await deleteUserData(req.userId);
    res.json({ message: 'Conta excluída com sucesso.' });
  } catch (err) {
    console.error('[users/me DELETE]', err);
    res.status(500).json({ message: 'Erro ao excluir conta.' });
  }
});

async function deleteUserData(userId) {
  const { default: mongoose } = await import('mongoose');
  const id = new mongoose.Types.ObjectId(userId);

  await Promise.all([
    Message.deleteMany({ senderId: id }),
    Report.deleteMany({ reportedBy: id }),
    require('../models/Review').deleteMany({ $or: [{ fromUserId: id }, { toUserId: id }] }),
    require('../models/GoodAction').deleteMany({ userId: id }),
    require('../models/ThankYou').deleteMany({ $or: [{ fromUserId: id }, { toUserId: id }] }),
    require('../models/Request').updateMany({ userId: id }, { $set: { deleted: true } }),
    Match.updateMany(
      { $or: [{ helperId: id }, { 'requestId.userId': id }] },
      { $set: { deleted: true } }
    ),
  ]);

  await User.findByIdAndDelete(userId);
}

// Block a user
router.post('/:id/block', auth, async (req, res) => {
  try {
    if (req.userId === req.params.id) {
      return res.status(400).json({ message: 'Cannot block yourself' });
    }
    await User.findByIdAndUpdate(req.userId, {
      $addToSet: { blockedUsers: req.params.id },
    });
    res.json({ message: 'User blocked' });
  } catch (err) {
    console.error('[users/block]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Unblock a user
router.delete('/:id/block', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, {
      $pull: { blockedUsers: req.params.id },
    });
    res.json({ message: 'User unblocked' });
  } catch (err) {
    console.error('[users/unblock]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// List blocked users
router.get('/me/blocked', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('blockedUsers', 'name nickname avatar')
      .select('blockedUsers');
    res.json(user?.blockedUsers ?? []);
  } catch (err) {
    console.error('[users/blocked]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Report a user
router.post('/:id/report', auth, async (req, res) => {
  try {
    const { reason, details, matchId } = req.body;
    if (!reason) return res.status(400).json({ message: 'Reason is required' });
    await Report.create({
      reportedBy: req.userId,
      reportedUser: req.params.id,
      matchId,
      reason,
      details,
    });
    res.status(201).json({ message: 'Report submitted' });
  } catch (err) {
    console.error('[users/report]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
