const { Schema, model, Types } = require('mongoose');

const ventMessageSchema = new Schema({
  sessionId: { type: Types.ObjectId, ref: 'VentSession', required: true },
  senderId:  { type: Types.ObjectId, ref: 'User', required: true },
  text:      { type: String, required: true },
}, { timestamps: true });

module.exports = model('VentMessage', ventMessageSchema);
