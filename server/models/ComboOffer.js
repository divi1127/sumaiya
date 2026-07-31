import mongoose from 'mongoose';

const comboOfferSchema = new mongoose.Schema({
  comboName: {
    type: String,
    required: [true, 'Combo name is required'],
    trim: true
  },
  comboSlug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  comboImage: {
    type: String,
    required: [true, 'Combo image is required']
  },
  comboDescription: {
    type: String,
    required: [true, 'Combo description is required']
  },
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  }],
  discountType: {
    type: String,
    enum: ['fixed', 'percentage'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true,
    min: [0, 'Discount cannot be negative']
  },
  finalPrice: {
    type: Number,
    // Can be calculated, but good to store for fast retrieval
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  }
}, {
  timestamps: true
});

const ComboOffer = mongoose.model('ComboOffer', comboOfferSchema);
export default ComboOffer;
