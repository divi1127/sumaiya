import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import User from '../models/User.js';
import CouponUsage from '../models/CouponUsage.js';
import sendWhatsAppMessage from "../utils/sendWhatsApp.js";
import { sendEmail } from '../utils/sendEmail.js';

// @desc    Create a new order
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req, res, next) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    paymentInfo,
    itemsPrice,
    taxPrice,
    shippingPrice,
    discountPrice,
    totalPrice,
    couponCode
  } = req.body;

  try {
    if (!orderItems || orderItems.length === 0) {
      res.status(400);
      throw new Error('No order items provided');
    }

    // 1. Verify and update stock
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product) {
        res.status(404);
        throw new Error(`Product not found: ${item.name}`);
      }

      if (item.size && item.color && product.productVariants && product.productVariants.length > 0) {
        const variant = product.productVariants.find(v => v.size === item.size && v.color === item.color);
        if (!variant) {
          res.status(400);
          throw new Error(`Variant not found for ${item.name} (${item.size}, ${item.color})`);
        }
        if (variant.stock < item.quantity) {
          res.status(400);
          throw new Error(`Insufficient stock for ${item.name} (${item.size}, ${item.color}). Only ${variant.stock} left.`);
        }
        variant.stock -= item.quantity;
      } else {
        if (product.stock < item.quantity) {
          res.status(400);
          throw new Error(`Insufficient stock for ${item.name}. Only ${product.stock} left.`);
        }
        product.stock -= item.quantity;
      }

      await product.save();
    }

    // 2. Recalculate Prices on the Backend (Prevent API Manipulation)
    const itemsPriceBackend = orderItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const shippingPriceBackend = itemsPriceBackend > 150 || itemsPriceBackend === 0 ? 0 : 15;
    const taxPriceBackend = Math.round((itemsPriceBackend * 0.08) * 100) / 100;

    let discountPriceBackend = 0;
    let couponAppliedId = undefined;
    let couponModel = 'Coupon';

    if (couponCode) {
      const uppercaseCode = couponCode.trim().toUpperCase();

      // Find standard coupon
      let coupon = await Coupon.findOne({ code: uppercaseCode });

      if (coupon) {
        // Validate standard coupon
        if (!coupon.isActive) {
          res.status(400);
          throw new Error('This coupon is no longer active');
        }

        if (new Date(coupon.expiryDate) < new Date()) {
          res.status(400);
          throw new Error('This coupon has expired');
        }

        const usageCount = await CouponUsage.countDocuments({
          user: req.user._id,
          coupon: coupon._id,
          couponModel: 'Coupon'
        });

        if (usageCount >= coupon.usageLimitPerUser) {
          res.status(400);
          throw new Error('Coupon already used');
        }

        if (itemsPriceBackend < coupon.minPurchase) {
          res.status(400);
          throw new Error(`Minimum purchase of ₹${coupon.minPurchase} required to use this coupon`);
        }

        if (coupon.discountType === 'percentage') {
          discountPriceBackend = Math.round(((coupon.discountValue / 100) * itemsPriceBackend) * 100) / 100;
        } else {
          discountPriceBackend = coupon.discountValue;
        }
        discountPriceBackend = Math.min(discountPriceBackend, itemsPriceBackend);
        couponAppliedId = coupon._id;
        couponModel = 'Coupon';
      } else {
        // Find referral code
        const referrer = await User.findOne({ referralCode: uppercaseCode });
        if (!referrer) {
          res.status(404);
          throw new Error('Invalid coupon or referral code');
        }

        if (referrer._id.toString() === req.user._id.toString()) {
          res.status(400);
          throw new Error('You cannot use your own referral code');
        }

        const usageCount = await CouponUsage.countDocuments({
          user: req.user._id,
          coupon: referrer._id,
          couponModel: 'User'
        });

        if (usageCount > 0) {
          res.status(400);
          throw new Error('Referral code already used');
        }

        const referralMinPurchase = 250;
        if (itemsPriceBackend < referralMinPurchase) {
          res.status(400);
          throw new Error(`Minimum purchase of ₹${referralMinPurchase} required to use referral code`);
        }

        discountPriceBackend = Math.min(100, itemsPriceBackend);
        couponAppliedId = referrer._id;
        couponModel = 'User';
      }
    }

    const totalPriceBackend = Math.round((itemsPriceBackend + shippingPriceBackend + taxPriceBackend - discountPriceBackend) * 100) / 100;

    // 3. Create the order in database using backend recalculated prices
    // const order = await Order.create({
    //   user: req.user._id,
    //   orderItems,
    //   shippingAddress,
    //   paymentMethod,
    //   paymentInfo: paymentMethod === 'Card'
    //     ? { status: 'Succeeded', transactionId: paymentInfo?.transactionId || 'ch_mock_' + Math.random().toString(36).substr(2, 9) }
    //     : { status: 'Pending' },
    //   itemsPrice: itemsPriceBackend,
    //   taxPrice: taxPriceBackend,
    //   shippingPrice: shippingPriceBackend,
    //   discountPrice: discountPriceBackend,
    //   totalPrice: totalPriceBackend,
    //   couponApplied: couponModel === 'Coupon' ? couponAppliedId : undefined
    // });


    // 3. Create the order in database using backend recalculated prices
const order = await Order.create({
  user: req.user._id,
  orderItems,
  shippingAddress,
  paymentMethod,
  paymentInfo: paymentMethod === 'Card'
    ? {
        status: 'Succeeded',
        transactionId:
          paymentInfo?.transactionId ||
          'ch_mock_' + Math.random().toString(36).substr(2, 9)
      }
    : { status: 'Pending' },

  itemsPrice: itemsPriceBackend,
  taxPrice: taxPriceBackend,
  shippingPrice: shippingPriceBackend,
  discountPrice: discountPriceBackend,
  totalPrice: totalPriceBackend,
  couponApplied: couponModel === 'Coupon'
    ? couponAppliedId
    : undefined
});

// SEND WHATSAPP MESSAGE
await sendWhatsAppMessage({
  customerName: req.user.name,
  orderId: order._id,
  paymentMethod: order.paymentMethod,
  totalPrice: order.totalPrice,
  shippingAddress: order.shippingAddress,
  orderItems: order.orderItems
});

// SEND ORDER PLACED EMAIL
const customer = await User.findById(req.user._id).select('name email');
if (customer?.email) {
  sendEmail({
    to: customer.email,
    subject: `Order Placed Successfully – Sumaiya'99`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#f1f5f9;border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#f59e0b,#6366f1);padding:40px 32px;text-align:center">
          <h1 style="margin:0;font-size:26px;font-weight:900;color:#fff">Order Placed Successfully</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px">Sumaiya'99 – Premium Fashion Store</p>
        </div>
        <div style="padding:40px 32px">
          <h2 style="margin:0 0 12px;font-size:20px;color:#f1f5f9">Hi ${customer.name},</h2>
          <p style="color:#94a3b8;line-height:1.7;margin:0 0 24px">Thank you for your order! Your order has been placed successfully and is pending confirmation.</p>
          <div style="background:#1e293b;border-radius:12px;padding:20px;margin-bottom:24px">
            <p style="margin:0 0 8px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px">Order Details</p>
            <p style="margin:0;font-size:14px;color:#f1f5f9"><strong>Order ID:</strong> <span style="font-family:monospace;color:#f59e0b">#${order._id.toString().slice(-8).toUpperCase()}</span></p>
            <p style="margin:8px 0 0;font-size:14px;color:#f1f5f9"><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
            <p style="margin:8px 0 0;font-size:14px;color:#f1f5f9"><strong>Total:</strong> ₹${order.totalPrice.toFixed(2)}</p>
            <p style="margin:8px 0 0;font-size:14px;color:#f1f5f9"><strong>Shipping Address:</strong> ${order.shippingAddress.street}, ${order.shippingAddress.city}</p>
            <p style="margin:8px 0 0;font-size:14px;color:#f1f5f9"><strong>Items:</strong> ${order.orderItems.map(i => `${i.name} x${i.quantity}`).join(', ')}</p>
          </div>
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/orders" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#6366f1);color:#fff;text-decoration:none;padding:14px 32px;border-radius:50px;font-weight:700;font-size:14px">Track Order</a>
        </div>
        <div style="padding:24px 32px;border-top:1px solid #1e293b;text-align:center">
          <p style="margin:0;font-size:12px;color:#475569">© ${new Date().getFullYear()} Sumaiya'99. All rights reserved.</p>
        </div>
      </div>
    `
  }).catch(err => console.error('Order placed email failed:', err));
}

// 4. Record Coupon/Referral Usage
if (couponAppliedId) {
  await CouponUsage.create({
    user: req.user._id,
    coupon: couponAppliedId,
    couponModel,
    order: order._id
  });
}

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/my-orders
// @access  Private
export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('couponApplied');

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    // Authorize: Only Admin or the order owner can view it
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Access denied. This order belongs to another customer.');
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel an order
// @route   PUT /api/orders/:id/cancel
// @access  Private
export const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    // Only let order owner cancel it
    if (order.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to cancel this order');
    }

    if (order.orderStatus === 'Delivered' || order.orderStatus === 'Shipped') {
      res.status(400);
      throw new Error(`Order cannot be cancelled. It has already been ${order.orderStatus.toLowerCase()}.`);
    }

    if (order.orderStatus === 'Cancelled') {
      res.status(400);
      throw new Error('Order is already cancelled.');
    }

    // Return inventory stock
    for (const item of order.orderItems) {
      const product = await Product.findById(item.product);
      if (product) {
        if (item.size && item.color && product.productVariants && product.productVariants.length > 0) {
          const variant = product.productVariants.find(v => v.size === item.size && v.color === item.color);
          if (variant) {
            variant.stock += item.quantity;
          } else {
            product.stock += item.quantity; // Fallback
          }
        } else {
          product.stock += item.quantity;
        }
        await product.save();
      }
    }

    order.orderStatus = 'Cancelled';
    await order.save();

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Customer marks order as delivered ("Confirm Delivery")
// @route   PUT /api/orders/:id/delivered
// @access  Private
export const markOrderDelivered = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    if (order.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized');
    }

    if (order.orderStatus !== 'Out For Delivery') {
      res.status(400);
      throw new Error('Order status must be Out For Delivery to confirm receipt');
    }

    order.orderStatus = 'Delivered';
    order.deliveryConfirmed = true;
    order.deliveryConfirmedAt = Date.now();
    order.deliveredAt = Date.now();
    order.paymentInfo.status = 'Succeeded';
    await order.save();

    // Notify admin via socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('orderStatusUpdated', order);
    }

    // Send order delivered email
    const customer = await User.findById(req.user._id).select('name email');
    if (customer?.email) {
      sendEmail({
        to: customer.email,
        subject: `Order Delivered Successfully – Sumaiya'99`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#f1f5f9;border-radius:16px;overflow:hidden">
            <div style="background:linear-gradient(135deg,#10b981,#6366f1);padding:40px 32px;text-align:center">
              <h1 style="margin:0;font-size:26px;font-weight:900;color:#fff">Order Delivered</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px">Sumaiya'99 – Premium Fashion Store</p>
            </div>
            <div style="padding:40px 32px">
              <h2 style="margin:0 0 12px;font-size:20px;color:#f1f5f9">Hi ${customer.name},</h2>
              <p style="color:#94a3b8;line-height:1.7;margin:0 0 24px">Your order has been delivered successfully. Enjoy your purchase!</p>
              <div style="background:#1e293b;border-radius:12px;padding:20px;margin-bottom:24px">
                <p style="margin:0 0 8px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px">Order Details</p>
                <p style="margin:0;font-size:14px;color:#f1f5f9"><strong>Order ID:</strong> <span style="font-family:monospace;color:#10b981">#${order._id.toString().slice(-8).toUpperCase()}</span></p>
                <p style="margin:8px 0 0;font-size:14px;color:#f1f5f9"><strong>Status:</strong> <span style="color:#10b981;font-weight:700">Delivered</span></p>
                <p style="margin:8px 0 0;font-size:14px;color:#f1f5f9"><strong>Total:</strong> ₹${order.totalPrice.toFixed(2)}</p>
                <p style="margin:8px 0 0;font-size:14px;color:#f1f5f9"><strong>Items:</strong> ${order.orderItems.map(i => `${i.name} x${i.quantity}`).join(', ')}</p>
              </div>
              <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/orders" style="display:inline-block;background:linear-gradient(135deg,#10b981,#6366f1);color:#fff;text-decoration:none;padding:14px 32px;border-radius:50px;font-weight:700;font-size:14px">Leave a Review</a>
            </div>
            <div style="padding:24px 32px;border-top:1px solid #1e293b;text-align:center">
              <p style="margin:0;font-size:12px;color:#475569">© ${new Date().getFullYear()} Sumaiya'99. All rights reserved.</p>
            </div>
          </div>
        `
      }).catch(err => console.error('Delivery confirmation email failed:', err));
    }

    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};
