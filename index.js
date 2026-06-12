require('dotenv').config();

const express = require('express');
const swaggerUi = require('swagger-ui-express');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const connectDB = require('./db/connection');
const authRoutes = require('./routes/auth');
const requestRoutes = require('./routes/requests');
const userRoutes = require('./routes/users');
const matchRoutes = require('./routes/matches');
const thankYouRoutes = require('./routes/thank-you');
const goodActionsRoutes = require('./routes/good-actions');
const chatRoutes        = require('./routes/chat');
const sponsorRoutes     = require('./routes/sponsors');
const adminAuthRoutes     = require('./routes/admin-auth');
const adminRequestRoutes  = require('./routes/admin-requests');
const productRoutes          = require('./routes/products');
const sponsorRequestRoutes   = require('./routes/sponsor-requests');
const postTemplateRoutes     = require('./routes/post-templates');
const ventRoutes             = require('./routes/vent');
const ratingsRoutes          = require('./routes/ratings');
const reviewsRoutes          = require('./routes/reviews');

const app = express();

app.use(express.json({ limit: '15mb' }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

const swaggerDocument = yaml.load(fs.readFileSync(path.join(__dirname, 'swagger.yaml'), 'utf8'));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customSiteTitle: 'Helpp API Docs',
}));

const { version, name } = require('./package.json');

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    name,
    version,
    node: process.version,
    env: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/requests', requestRoutes);
app.use('/matches', matchRoutes);
app.use('/thank-you', thankYouRoutes);
app.use('/good-actions', goodActionsRoutes);
app.use('/chat', chatRoutes);
app.use('/vent', ventRoutes);
app.use('/sponsors', sponsorRoutes);
app.use('/admin', adminAuthRoutes);
app.use('/admin/requests', adminRequestRoutes);
app.use('/products', productRoutes);
app.use('/sponsor-requests', sponsorRequestRoutes);
app.use('/post-templates', postTemplateRoutes);
app.use('/ratings', ratingsRoutes);
app.use('/reviews', reviewsRoutes);

const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`)))
  .catch((err) => { console.error('Failed to connect to MongoDB', err); process.exit(1); });
