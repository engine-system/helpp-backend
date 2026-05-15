const { Schema, model, Types } = require('mongoose');

const requestSchema = new Schema({
  userId:    { type: Types.ObjectId, ref: 'User', required: true },
  category:  { type: String, required: true },
  reason:    { type: String, required: true },
  urgency:   { type: String, required: true },
  giveBack:  { type: String, required: true },
  status:    { type: String, default: 'pending' },
  latitude:  { type: Number },
  longitude: { type: Number },
}, { timestamps: true });

module.exports = model('Request', requestSchema);
