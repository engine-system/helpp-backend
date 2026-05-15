const { Schema, model, Types } = require('mongoose');

const ventQueueSchema = new Schema({
  userId: { type: Types.ObjectId, ref: 'User', required: true, unique: true },
  status: { type: String, enum: ['waiting', 'matched'], default: 'waiting' },
}, { timestamps: true });

module.exports = model('VentQueue', ventQueueSchema);
