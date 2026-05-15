const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = Router();

const signAccessToken = (userId) =>
  jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: '15m' });

const signRefreshToken = (userId) =>
  jwt.sign({ sub: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, privacyPolicyVersion, termsOfUseVersion } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!privacyPolicyVersion || !termsOfUseVersion) {
      return res.status(400).json({ message: 'Legal acceptance is required' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashed,
      privacyPolicy: { version: privacyPolicyVersion, acceptedAt: new Date() },
      termsOfUse:    { version: termsOfUseVersion,    acceptedAt: new Date() },
    });

    res.status(201).json({
      accessToken: signAccessToken(user._id),
      refreshToken: signRefreshToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileComplete: user.profileComplete,
        privacyPolicyVersion: user.privacyPolicy?.version ?? null,
        termsOfUseVersion:    user.termsOfUse?.version    ?? null,
      },
    });
  } catch (err) {
    console.error('[POST /auth/register]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({
      accessToken: signAccessToken(user._id),
      refreshToken: signRefreshToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileComplete: user.profileComplete,
        privacyPolicyVersion: user.privacyPolicy?.version ?? null,
        termsOfUseVersion:    user.termsOfUse?.version    ?? null,
      },
    });
  } catch (err) {
    console.error('[POST /auth/login]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token required' });
  }

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    res.json({ accessToken: signAccessToken(payload.sub) });
  } catch {
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
});

router.patch('/legal', auth, async (req, res) => {
  try {
    const { privacyPolicyVersion, termsOfUseVersion } = req.body;
    const now = new Date();
    const update = {};

    if (privacyPolicyVersion) {
      update['privacyPolicy'] = { version: privacyPolicyVersion, acceptedAt: now };
    }
    if (termsOfUseVersion) {
      update['termsOfUse'] = { version: termsOfUseVersion, acceptedAt: now };
    }

    if (!Object.keys(update).length) {
      return res.status(400).json({ message: 'No version provided' });
    }

    await User.findByIdAndUpdate(req.userId, { $set: update });
    res.json({ ok: true });
  } catch (err) {
    console.error('[PATCH /auth/legal]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
