const { Schema, model, Types } = require('mongoose');

const matchSchema = new Schema({
  requestId:    { type: Types.ObjectId, ref: 'Request', required: true },
  helperId:     { type: Types.ObjectId, ref: 'User', required: true },
  status:       { type: String, default: 'active' },
  offerMessage:      { type: String },
  proofImage:        { type: String }, // base64 da foto de comprovante
  ratedByHelper:     { type: Boolean, default: false },
  ratedByRequester:  { type: Boolean, default: false },
}, { timestamps: true });

module.exports = model('Match', matchSchema);
