import mongoose from 'mongoose';

const paymentSettingsSchema = new mongoose.Schema({
  upiId: {
    type: String,
    default: '',
    trim: true
  },
  qrCode: {
    type: String, // URL to QR code image
    default: ''
  },
  accountHolderName: {
    type: String,
    default: '',
    trim: true
  },
  paymentInstructions: {
    type: String, // Detailed payment instructions for customers
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Ensure only one settings document exists
paymentSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      upiId: '',
      qrCode: '',
      accountHolderName: '',
      paymentInstructions: '',
      isActive: true
    });
  }
  return settings;
};

const PaymentSettings = mongoose.model('PaymentSettings', paymentSettingsSchema);
export default PaymentSettings;
