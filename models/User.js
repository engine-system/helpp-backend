const { Schema, model } = require('mongoose');

const userSchema = new Schema({
  name:            { type: String, required: true },
  email:           { type: String, required: true, unique: true },
  password:        { type: String, required: true },
  nickname:        { type: String },
  cpfSuffix:       { type: String },
  phoneSuffix:     { type: String },
  avatar:          { type: String },
  city:            { type: String },
  neighborhood:    { type: String },
  latitude:        { type: Number },
  longitude:       { type: Number },
  profileComplete: { type: Boolean, default: false },
  helpReceived:        { type: Number, default: 0 },
  helpGiven:           { type: Number, default: 0 },
  helperRatingSum:     { type: Number, default: 0 },
  helperRatingCount:   { type: Number, default: 0 },
  requesterRatingSum:  { type: Number, default: 0 },
  requesterRatingCount:{ type: Number, default: 0 },
  privacyPolicy: {
    version:    { type: String },
    acceptedAt: { type: Date },
  },
  termsOfUse: {
    version:    { type: String },
    acceptedAt: { type: Date },
  },
  blockedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

module.exports = model('User', userSchema);
