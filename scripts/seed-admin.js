require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const AdminUser = require('../models/AdminUser');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Conectado ao MongoDB.');

  const email = 'root@helpp';
  const plain  = '123';

  const exists = await AdminUser.findOne({ email });
  if (exists) {
    console.log('Usuário root@helpp já existe. Nada foi alterado.');
    process.exit(0);
  }

  const password = await bcrypt.hash(plain, 10);
  await AdminUser.create({ email, password });
  console.log('Admin criado: root@helpp / 123');
  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });
