const { Schema, model } = require('mongoose');

const sponsorSchema = new Schema(
  {
    companyName: { type: String, required: true, trim: true },
    cnpj:        { type: String, required: true, trim: true },
    contactName: { type: String, required: true, trim: true },
    email:       { type: String, required: true, trim: true, lowercase: true },
    phone:       { type: String, trim: true },
    city:        { type: String, required: true, trim: true },
    supportType: { type: String, trim: true },
    notes:  { type: String, trim: true },
    logo:   { type: String }, // base64
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = model('Sponsor', sponsorSchema);
