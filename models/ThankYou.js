const { Schema, model, Types } = require('mongoose');

const thankYouSchema = new Schema({
  fromUserId:   { type: Types.ObjectId, ref: 'User', required: true },
  toUserId:     { type: Types.ObjectId, ref: 'User', required: true },
  matchId:      { type: Types.ObjectId, ref: 'Match', required: true },
  message:      { type: String, default: '' },
  audioBase64:  { type: String },
  isPublic:     { type: Boolean, default: true },
  hasAudio:     { type: Boolean, default: false },
}, { timestamps: true });

module.exports = model('ThankYou', thankYouSchema);
