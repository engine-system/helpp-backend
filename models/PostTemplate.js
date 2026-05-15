const { Schema, model } = require('mongoose');

const postTemplateSchema = new Schema(
  {
    sponsorId: { type: Schema.Types.ObjectId, ref: 'Sponsor', required: true },
    image:     { type: String },
    caption:   { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = model('PostTemplate', postTemplateSchema);
