const { Schema, model } = require('mongoose');

const reportSchema = new Schema({
  reportedBy:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reportedUser:    { type: Schema.Types.ObjectId, ref: 'User' },
  reportedMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
  matchId:         { type: Schema.Types.ObjectId, ref: 'Match' },
  reason:          { type: String, required: true },
  details:         { type: String },
  status:          { type: String, enum: ['pending', 'reviewed', 'dismissed'], default: 'pending' },
}, { timestamps: true });

module.exports = model('Report', reportSchema);
