const { Schema, model, Types } = require('mongoose');

const reviewSchema = new Schema({
  fromUserId: { type: Types.ObjectId, ref: 'User', required: true },
  toUserId:   { type: Types.ObjectId, ref: 'User', required: true },
  sourceType: { type: String, enum: ['match', 'vent'], required: true },
  sourceId:   { type: Types.ObjectId, required: true },
  score:       { type: Number, required: true, min: 1, max: 5 },
  text:        { type: String, default: '' },
  audioBase64: { type: String },
}, { timestamps: true });

// Prevent duplicate review for the same source by the same person
reviewSchema.index({ fromUserId: 1, sourceId: 1 }, { unique: true });

module.exports = model('Review', reviewSchema);
