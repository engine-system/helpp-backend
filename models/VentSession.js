const { Schema, model, Types } = require('mongoose');

const ventSessionSchema = new Schema({
  ventUserId: { type: Types.ObjectId, ref: 'User', required: true },
  helperId:   { type: Types.ObjectId, ref: 'User', required: true },
  status:            { type: String, enum: ['active', 'ended'], default: 'active' },
  ratedByHelper:     { type: Boolean, default: false },
  ratedByVentUser:   { type: Boolean, default: false },
}, { timestamps: true });

module.exports = model('VentSession', ventSessionSchema);
