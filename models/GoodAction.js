const { Schema, model, Types } = require('mongoose');

const goodActionSchema = new Schema({
  userId:      { type: Types.ObjectId, ref: 'User', required: true },
  description: { type: String, required: true },
  photoUrl:    { type: String },
}, { timestamps: true });

module.exports = model('GoodAction', goodActionSchema);
