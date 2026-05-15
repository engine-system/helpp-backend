const { Schema, model } = require('mongoose');

const sponsorRequestSchema = new Schema(
  {
    sponsorId:   { type: Schema.Types.ObjectId, ref: 'Sponsor', required: true },
    productId:   { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    companyName: { type: String, trim: true },
    userId:      { type: Schema.Types.ObjectId, ref: 'User' },
    userName:    { type: String, required: true, trim: true },
    userContact: { type: String, required: true, trim: true },
    message:     { type: String, trim: true },
    status:      { type: String, enum: ['pending', 'contacted', 'resolved'], default: 'pending' },
    contactedAt: { type: Date },
    resolvedAt:  { type: Date },
  },
  { timestamps: true }
);

module.exports = model('SponsorRequest', sponsorRequestSchema);
