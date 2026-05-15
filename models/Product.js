const { Schema, model } = require('mongoose');

const productSchema = new Schema(
  {
    sponsorId:   { type: Schema.Types.ObjectId, ref: 'Sponsor', required: true },
    name:        { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    type:        { type: String, enum: ['Produto', 'Serviço'], required: true },
    image:       { type: String }, // base64
    active:      { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = model('Product', productSchema);
