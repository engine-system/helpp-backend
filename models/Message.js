const { Schema, model, Types } = require('mongoose');

const messageSchema = new Schema({
  matchId:  { type: Types.ObjectId, ref: 'Match', required: true },
  senderId: { type: Types.ObjectId, ref: 'User',  required: true },
  text:     { type: String, required: true, trim: true },
}, { timestamps: true });

module.exports = model('Message', messageSchema);
