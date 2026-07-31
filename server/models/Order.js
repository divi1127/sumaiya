import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  variant: { type: String }, // e.g. "Size: M, Color: Black"
  size: { type: String },
  color: { type: String },
  comboId: { type: mongoose.Schema.Types.ObjectId, ref: 'ComboOffer' },
  comboName: { type: String },
  appliedDiscount: { type: Number, default: 0 }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderItems: [orderItemSchema],
  shippingAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    zipCode: { type: String, required: true }
  },
  paymentMethod: {
    type: String,
    enum: ['COD', 'Card', 'UPI'],
    required: true
  },
  paymentInfo: {
    status: { type: String, default: 'Pending' }, // e.g., 'Pending', 'Succeeded', 'Failed'
    transactionId: { type: String }
  },
  // New payment verification fields
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Verification Pending', 'Verified', 'Rejected'],
    default: 'Pending'
  },
  paymentScreenshot: {
    type: String, // URL to uploaded screenshot
    default: null
  },
  utrNumber: {
    type: String,
    default: null
  },
  transactionId: {
    type: String,
    default: null
  },
  rejectionReason: {
    type: String,
    default: null
  },
  deliveryConfirmed: {
    type: Boolean,
    default: false
  },
  deliveryConfirmedAt: {
    type: Date,
    default: null
  },
  verificationDate: {
    type: Date,
    default: null
  },
  deliveryDate: {
    type: Date,
    default: null
  },
  submittedAt: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    default: ''
  },
  itemsPrice: { type: Number, required: true, default: 0.0 },
  taxPrice: { type: Number, required: true, default: 0.0 },
  shippingPrice: { type: Number, required: true, default: 0.0 },
  discountPrice: { type: Number, required: true, default: 0.0 },
  totalPrice: { type: Number, required: true, default: 0.0 },
  orderStatus: {
    type: String,
    enum: ['Pending', 'Processing', 'Out For Delivery', 'Delivered'],
    default: 'Pending'
  },
  couponApplied: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon'
  },
  deliveredAt: { type: Date }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual attributes for prompt compatibility
orderSchema.virtual('orderId').get(function() {
  return this._id.toString();
});

orderSchema.virtual('userId').get(function() {
  return this.user;
});

orderSchema.virtual('products').get(function() {
  return this.orderItems;
});

orderSchema.virtual('amount').get(function() {
  return this.totalPrice;
});

const Order = mongoose.model('Order', orderSchema);
export default Order;
