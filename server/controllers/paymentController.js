import PaymentSettings from '../models/PaymentSettings.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import { sendEmail } from '../utils/sendEmail.js';

// ===== PAYMENT SETTINGS MANAGEMENT (ADMIN) =====

// Get payment settings
export const getPaymentSettings = async (req, res) => {
  try {
    const settings = await PaymentSettings.getSettings();
    res.json({
      success: true,
      data: settings,
      isConfigured: !!(settings.upiId && settings.qrCode && settings.accountHolderName)
    });
  } catch (error) {
    console.error('Error fetching payment settings:', error);
    // Return default empty settings on error
    res.json({
      success: true,
      data: {
        upiId: '6374383385@ybl',
        qrCode: '',
        accountHolderName: '',
        paymentInstructions: '',
        isActive: true
      },
      isConfigured: false
    });
  }
};

// Update payment settings (Admin only)
export const updatePaymentSettings = async (req, res) => {
  try {
    const { upiId, accountHolderName, paymentInstructions, isActive } = req.body;
    const qrCode = req.file ? req.file.path : req.body.qrCode;

    if (!upiId || !accountHolderName || !qrCode) {
      return res.status(400).json({
        success: false,
        message: 'UPI ID, Account Holder Name, and QR Code are required'
      });
    }

    let settings = await PaymentSettings.findOne();
    
    if (!settings) {
      settings = new PaymentSettings({
        upiId,
        accountHolderName,
        qrCode,
        paymentInstructions: paymentInstructions || '',
        isActive: isActive !== undefined ? isActive : true
      });
    } else {
      settings.upiId = upiId;
      settings.accountHolderName = accountHolderName;
      if (qrCode) settings.qrCode = qrCode;
      settings.paymentInstructions = paymentInstructions || settings.paymentInstructions;
      if (isActive !== undefined) settings.isActive = isActive;
    }

    await settings.save();

    res.json({
      success: true,
      message: 'Payment settings updated successfully',
      data: settings
    });
  } catch (error) {
    console.error('Error updating payment settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating payment settings',
      error: error.message
    });
  }
};

// ===== PAYMENT VERIFICATION (CUSTOMER) =====

// Upload payment proof (Customer)
export const uploadPaymentProof = async (req, res) => {
  try {
    const { orderId, utrNumber, notes } = req.body;
    const userId = req.user._id;

    if (!orderId || !utrNumber) {
      return res.status(400).json({
        success: false,
        message: 'Order ID and Transaction ID (UTR Number) are required'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Payment screenshot is required'
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Verify that the order belongs to the current user
    if (order.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: This order does not belong to you'
      });
    }

    // Normalize path: replace backslashes (Windows), strip leading slash duplicates
    const normalizedPath = req.file.path.replace(/\\/g, '/').replace(/^\/+/, '');
    const screenshotUrl = '/' + normalizedPath;

    // Update order with payment proof
    order.paymentScreenshot = screenshotUrl;
    order.utrNumber = utrNumber;
    order.transactionId = utrNumber;
    order.paymentStatus = 'Verification Pending';
    order.notes = notes || '';
    order.submittedAt = new Date();
    order.rejectionReason = null; // Clear any previous rejection reason

    await order.save();

    // Send confirmation email to customer
    const user = await User.findById(order.user);
    if (user && user.email) {
      try {
        await sendEmail({
          to: user.email,
          subject: 'Payment Proof Submitted Successfully',
          html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f1f5f9; border-radius: 20px; overflow: hidden; border: 1px solid #334155;">
              <div style="background: linear-gradient(135deg, #06b6d4, #3b82f6); padding: 40px 32px; text-align: center;">
                <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Proof Submitted!</h1>
                <p style="margin: 8px 0 0; color: #e2e8f0; font-size: 14px;">We have received your transaction details</p>
              </div>
              <div style="padding: 40px 32px;">
                <p style="font-size: 16px; line-height: 1.6; color: #cbd5e1; margin-top: 0;">Hi ${user.name || 'Valued Customer'},</p>
                <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 32px;">Your payment proof has been successfully submitted. Our verification team is currently checking the transaction details. Below is your submission summary:</p>
                
                <div style="background: #1e293b; border-radius: 16px; padding: 24px; border: 1px solid #334155; margin-bottom: 32px;">
                  <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <tr>
                      <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Order Number</td>
                      <td style="padding: 8px 0; color: #f1f5f9; font-weight: 700; text-align: right; font-family: monospace;">#${order._id.toString().toUpperCase()}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Transaction ID</td>
                      <td style="padding: 8px 0; color: #06b6d4; font-weight: 700; text-align: right; font-family: monospace;">${utrNumber}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Amount Paid</td>
                      <td style="padding: 8px 0; color: #10b981; font-weight: 800; text-align: right; font-size: 16px;">₹${order.totalPrice.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Verification Status</td>
                      <td style="padding: 8px 0; color: #fbbf24; font-weight: 700; text-align: right; text-transform: uppercase;">Pending</td>
                    </tr>
                  </table>
                </div>

                <div style="background: #0f172a; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 0 12px 12px 0; margin-bottom: 32px;">
                  <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #94a3b8;">
                    <strong>What's Next?</strong> Admin will verify your payment details shortly. Once approved, your order status will update to <em>Confirmed</em> and processing will begin.
                  </p>
                </div>

                <div style="text-align: center;">
                  <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/orders" style="display: inline-block; background: linear-gradient(135deg, #06b6d4, #3b82f6); color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 50px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 12px rgba(6, 182, 212, 0.25); transition: all 0.3s ease;">Track My Order</a>
                </div>
              </div>
              <div style="padding: 24px 32px; border-top: 1px solid #334155; text-align: center; background: #0b0f19;">
                <p style="margin: 0; font-size: 12px; color: #475569;">© ${new Date().getFullYear()} Store. All rights reserved.</p>
              </div>
            </div>
          `
        });
      } catch (mailErr) {
        console.error('Failed to send proof submission email:', mailErr);
      }
    }

    // Notify admin about payment verification pending
    await notifyAdmin('Verification Pending', order, 'Payment proof uploaded by customer for verification');

    res.json({
      success: true,
      message: 'Your payment proof has been submitted successfully. Our team will verify your payment and process your order.',
      data: order
    });
  } catch (error) {
    console.error('Error uploading payment proof:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading payment proof',
      error: error.message
    });
  }
};

// ===== PAYMENT VERIFICATION (ADMIN) =====

// Get orders pending payment verification
export const getPendingPaymentOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, searchTerm = '' } = req.query;
    const skip = (page - 1) * limit;

    const searchQuery = searchTerm ? {
      $or: [
        { 'utrNumber': { $regex: searchTerm, $options: 'i' } },
        { 'transactionId': { $regex: searchTerm, $options: 'i' } },
        { '_id': { $regex: searchTerm, $options: 'i' } }
      ]
    } : {};

    const orders = await Order.find({
      paymentStatus: 'Verification Pending',
      paymentMethod: 'UPI',
      ...searchQuery
    })
      .populate('user', 'name email phone')
      .populate('couponApplied', 'code')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments({
      paymentStatus: 'Verification Pending',
      paymentMethod: 'UPI',
      ...searchQuery
    });

    res.json({
      success: true,
      data: orders,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching pending payment orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
};

// Approve payment (Admin)
export const approvePayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.paymentStatus !== 'Verification Pending') {
      return res.status(400).json({
        success: false,
        message: 'Order is not pending payment verification'
      });
    }

    order.paymentStatus = 'Verified';
    order.orderStatus = 'Confirmed';
    order.verificationDate = new Date();
    await order.save();

    // Notify customer
    const user = await User.findById(order.user);
    if (user && user.email) {
      try {
        await sendEmail({
          to: user.email,
          subject: 'Payment Verified',
          html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f1f5f9; border-radius: 20px; overflow: hidden; border: 1px solid #334155;">
              <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 40px 32px; text-align: center;">
                <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Payment Verified</h1>
                <p style="margin: 8px 0 0; color: #e2e8f0; font-size: 14px;">Payment Verified Successfully</p>
              </div>
              <div style="padding: 40px 32px;">
                <p style="font-size: 16px; line-height: 1.6; color: #cbd5e1; margin-top: 0;">Hi ${user.name || 'Valued Customer'},</p>
                <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 24px;">Your payment for order <strong>#${order._id.toString().toUpperCase()}</strong> has been verified successfully.</p>
                
                <div style="background: #1e293b; border-radius: 16px; padding: 20px; border: 1px solid #334155; margin-bottom: 24px;">
                  <p style="margin: 0; font-size: 14px; color: #f1f5f9;"><strong>Order ID:</strong> <span style="font-family: monospace; color: #10b981;">#${order._id}</span></p>
                  <p style="margin: 8px 0 0; font-size: 14px; color: #f1f5f9;"><strong>Transaction ID:</strong> <span style="font-family: monospace; color: #06b6d4;">${order.transactionId || order.utrNumber}</span></p>
                  <p style="margin: 8px 0 0; font-size: 14px; color: #f1f5f9;"><strong>Verification Status:</strong> <span style="color: #10b981; font-weight: bold;">Verified Successfully</span></p>
                </div>
                
                <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">Your order is being prepared and will be processed shortly.</p>
              </div>
              <div style="padding: 24px 32px; border-top: 1px solid #334155; text-align: center; background: #0b0f19;">
                <p style="margin: 0; font-size: 12px; color: #475569;">© ${new Date().getFullYear()} Store. All rights reserved.</p>
              </div>
            </div>
          `
        });
      } catch (mailErr) {
        console.error('Failed to send payment verification success email:', mailErr);
      }
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: order
    });
  } catch (error) {
    console.error('Error approving payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving payment',
      error: error.message
    });
  }
};

// Reject payment (Admin)
export const rejectPayment = async (req, res) => {
  try {
    const { orderId, rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.paymentStatus !== 'Verification Pending') {
      return res.status(400).json({
        success: false,
        message: 'Order is not pending payment verification'
      });
    }

    order.paymentStatus = 'Rejected';
    order.rejectionReason = rejectionReason;
    await order.save();

    // Notify customer
    const user = await User.findById(order.user);
    if (user && user.email) {
      try {
        await sendEmail({
          to: user.email,
          subject: 'Payment Verification Failed',
          html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f1f5f9; border-radius: 20px; overflow: hidden; border: 1px solid #ef4444/20;">
              <div style="background: linear-gradient(135deg, #ef4444, #b91c1c); padding: 40px 32px; text-align: center;">
                <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Verification Failed</h1>
                <p style="margin: 8px 0 0; color: #fecaca; font-size: 14px;">Payment Verification Failed</p>
              </div>
              <div style="padding: 40px 32px;">
                <p style="font-size: 16px; line-height: 1.6; color: #cbd5e1; margin-top: 0;">Hi ${user.name || 'Valued Customer'},</p>
                <p style="font-size: 14px; line-height: 1.6; color: #94a3b8;">Your payment proof for order <strong>#${order._id.toString().toUpperCase()}</strong> could not be verified.</p>
                
                <div style="background: #7f1d1d/10; border-left: 4px solid #ef4444; border-radius: 0 12px 12px 0; padding: 20px; margin: 24px 0;">
                  <h4 style="margin: 0 0 8px; color: #fca5a5; font-size: 14px; font-weight: bold;">Reason for rejection:</h4>
                  <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #fecaca;">${rejectionReason}</p>
                </div>
                
                <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">Instructions to upload correct payment proof: Please review the reason above, go to your order tracking page, and submit a new payment screenshot showing transaction amount and UTR ID correctly.</p>
              </div>
              <div style="padding: 24px 32px; border-top: 1px solid #334155; text-align: center; background: #0b0f19;">
                <p style="margin: 0; font-size: 12px; color: #475569;">© ${new Date().getFullYear()} Store. All rights reserved.</p>
              </div>
            </div>
          `
        });
      } catch (mailErr) {
        console.error('Failed to send rejection email:', mailErr);
      }
    }

    res.json({
      success: true,
      message: 'Payment rejected successfully',
      data: order
    });
  } catch (error) {
    console.error('Error rejecting payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting payment',
      error: error.message
    });
  }
};

// ===== ORDER MANAGEMENT WITH PAYMENT INFO =====

// Get all orders with payment details
export const getAllOrdersWithPayment = async (req, res) => {
  try {
    const { page = 1, limit = 10, paymentStatus = '', orderStatus = '', searchTerm = '' } = req.query;
    const skip = (page - 1) * limit;

    const filters = { paymentMethod: 'UPI' };

    if (paymentStatus) filters.paymentStatus = paymentStatus;
    if (orderStatus) filters.orderStatus = orderStatus;

    if (searchTerm) {
      filters.$or = [
        { _id: { $regex: searchTerm, $options: 'i' } },
        { 'user.email': { $regex: searchTerm, $options: 'i' } },
        { 'utrNumber': { $regex: searchTerm, $options: 'i' } }
      ];
    }

    const orders = await Order.find(filters)
      .populate('user', 'name email phone')
      .populate('couponApplied', 'code discountType discountValue')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments(filters);

    res.json({
      success: true,
      data: orders,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
};

// Get single order with payment details
export const getOrderPaymentDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate('user', 'name email phone address')
      .populate('orderItems.product', 'name image price')
      .populate('couponApplied', 'code discountType discountValue');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Authorization: allow the order owner OR any admin
    const isOwner = order.user?._id?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: this order belongs to another user'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order details',
      error: error.message
    });
  }
};

// ===== DASHBOARD STATISTICS =====

// Get payment statistics for admin dashboard
export const getPaymentStatistics = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments({ paymentMethod: 'UPI' });
    const pendingPayments = await Order.countDocuments({
      paymentMethod: 'UPI',
      paymentStatus: 'Pending'
    });
    const verificationPending = await Order.countDocuments({
      paymentMethod: 'UPI',
      paymentStatus: 'Verification Pending'
    });
    const verifiedPayments = await Order.countDocuments({
      paymentMethod: 'UPI',
      paymentStatus: 'Verified'
    });
    const rejectedPayments = await Order.countDocuments({
      paymentMethod: 'UPI',
      paymentStatus: 'Rejected'
    });
    const deliveredOrders = await Order.countDocuments({
      paymentMethod: 'UPI',
      orderStatus: { $in: ['Delivered', 'Completed'] }
    });

    const totalRevenueResult = await Order.aggregate([
      { $match: { paymentMethod: 'UPI', paymentStatus: 'Verified' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const totalRevenue = totalRevenueResult[0]?.total || 0;

    // Monthly revenue for last 12 months
    const monthlyRevenueResult = await Order.aggregate([
      { $match: { paymentMethod: 'UPI', paymentStatus: 'Verified' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$totalPrice' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.json({
      success: true,
      data: {
        totalOrders,
        pendingPayments,
        verificationPending,
        verifiedPayments,
        rejectedPayments,
        deliveredOrders,
        totalRevenue,
        monthlyRevenue: monthlyRevenueResult
      }
    });
  } catch (error) {
    console.error('Error fetching payment statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
};

// Get recent transactions
export const getRecentTransactions = async (req, res) => {
  try {
    const limit = req.query.limit || 10;

    const orders = await Order.find({ paymentMethod: 'UPI' })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('_id user totalPrice paymentStatus orderStatus createdAt utrNumber');

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Error fetching recent transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions',
      error: error.message
    });
  }
};

// ===== HELPER FUNCTIONS =====

// Notify admin about payment verification pending
async function notifyAdmin(type, order, message) {
  try {
    // In a real app, this would send notifications to admin dashboard/email
    console.log(`[${type}] ${message} - Order: ${order._id}`);
  } catch (error) {
    console.error('Error notifying admin:', error);
  }
}
