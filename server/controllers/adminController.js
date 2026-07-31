import Order from '../models/Order.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import AdminActivityLog from '../models/AdminActivityLog.js';
import { sendEmail } from '../utils/sendEmail.js';


export const getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({})
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PUT /api/admin/orders/:id
// @access  Private/Admin
export const updateOrderStatus = async (req, res, next) => {
  const { status } = req.body;

  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    const oldStatus = order.orderStatus;
    
    // Strict Workflow Validation
    const validStatuses = ['Pending', 'Processing', 'Out For Delivery', 'Delivered'];
    if (!validStatuses.includes(status)) {
      res.status(400);
      throw new Error('Invalid order status');
    }

    order.orderStatus = status;

    if (status === 'Delivered') {
      order.deliveredAt = Date.now();
      order.paymentInfo.status = 'Succeeded'; // enforce completion
    }

    await order.save();

    // Emit Socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.emit('orderStatusUpdated', order);
    }

    // Send order status email (non-blocking)
    const customer = await User.findById(order.user).select('name email');
    if (customer?.email) {
      const statusColors = {
        Pending: '#f59e0b', // Yellow
        Processing: '#3b82f6', // Blue
        'Out For Delivery': '#f97316', // Orange
        Delivered: '#10b981', // Green
      };
      
      const statusMessages = {
        Pending: 'Your order has been received and is pending confirmation.',
        Processing: 'Your order has been confirmed and is being prepared.',
        'Out For Delivery': 'Your order is on its way and will arrive soon.',
        Delivered: 'Your order has been delivered successfully. Enjoy your purchase!'
      };
      
      const statusSubjects = {
        Pending: 'Order Placed Successfully – Sumaiya\'99',
        Processing: 'Order Confirmed – Sumaiya\'99',
        'Out For Delivery': 'Out For Delivery – Sumaiya\'99',
        Delivered: 'Order Delivered Successfully – Sumaiya\'99'
      };

      const color = statusColors[status] || '#06b6d4';
      const message = statusMessages[status] || `Your order status has been updated to ${status}.`;
      const subject = statusSubjects[status] || `Order Update: Your order is now ${status} – Sumaiya'99`;

      sendEmail({
        to: customer.email,
        subject,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#f1f5f9;border-radius:16px;overflow:hidden">
            <div style="background:linear-gradient(135deg,${color},#6366f1);padding:40px 32px;text-align:center">
              <h1 style="margin:0;font-size:26px;font-weight:900;color:#fff">Order ${status}</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px">Sumaiya'99 – Premium Fashion Store</p>
            </div>
            <div style="padding:40px 32px">
              <h2 style="margin:0 0 12px;font-size:20px;color:#f1f5f9">Hi ${customer.name},</h2>
              <p style="color:#94a3b8;line-height:1.7;margin:0 0 24px">${message}</p>
              <div style="background:#1e293b;border-radius:12px;padding:20px;margin-bottom:24px">
                <p style="margin:0 0 8px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px">Order Details</p>
                <p style="margin:0;font-size:14px;color:#f1f5f9"><strong>Order ID:</strong> <span style="font-family:monospace;color:${color}">#${order._id.toString().slice(-8).toUpperCase()}</span></p>
                <p style="margin:8px 0 0;font-size:14px;color:#f1f5f9"><strong>Status:</strong> <span style="color:${color};font-weight:700">${status}</span></p>
                <p style="margin:8px 0 0;font-size:14px;color:#f1f5f9"><strong>Total:</strong> ₹${order.totalPrice.toFixed(2)}</p>
                <p style="margin:8px 0 0;font-size:14px;color:#f1f5f9"><strong>Items:</strong> ${order.orderItems.map(i => `${i.name} x${i.quantity}`).join(', ')}</p>
              </div>
              <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/orders" style="display:inline-block;background:linear-gradient(135deg,${color},#6366f1);color:#fff;text-decoration:none;padding:14px 32px;border-radius:50px;font-weight:700;font-size:14px">View My Orders</a>
            </div>
            <div style="padding:24px 32px;border-top:1px solid #1e293b;text-align:center">
              <p style="margin:0;font-size:12px;color:#475569">© ${new Date().getFullYear()} Sumaiya'99. All rights reserved.</p>
            </div>
          </div>
        `
      }).catch(err => console.error('Order status email failed:', err));
    }

    // Log Activity
    await AdminActivityLog.create({
      admin: req.user._id,
      action: 'UPDATE_ORDER_STATUS',
      details: `Updated order ${order._id} status from ${oldStatus} to ${status}`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle block/unblock user
// @route   PUT /api/admin/users/:id/block
// @access  Private/Admin
export const toggleUserBlock = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (user.role === 'admin') {
      res.status(400);
      throw new Error('Cannot block administrative accounts');
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    // Log Activity
    await AdminActivityLog.create({
      admin: req.user._id,
      action: user.isBlocked ? 'BLOCK_USER' : 'UNBLOCK_USER',
      details: `${user.isBlocked ? 'Blocked' : 'Unblocked'} user ${user.email} (${user._id})`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: `User has been successfully ${user.isBlocked ? 'blocked' : 'unblocked'}`,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get admin dashboard analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
export const getAnalytics = async (req, res, next) => {
  try {
    // 1. Total Revenue
    const completedOrders = await Order.find({ orderStatus: { $ne: 'Cancelled' } });
    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.totalPrice, 0);

    // 2. Count metrics
    const totalOrders = await Order.countDocuments({});
    const totalUsers = await User.countDocuments({ role: 'customer' });
    const totalProducts = await Product.countDocuments({});

    // 3. Best Selling Products (Aggregation/Calculation)
    const productSales = {};
    completedOrders.forEach(order => {
      order.orderItems.forEach(item => {
        const prodId = item.product.toString();
        if (!productSales[prodId]) {
          productSales[prodId] = {
            id: prodId,
            name: item.name,
            quantity: 0,
            revenue: 0
          };
        }
        productSales[prodId].quantity += item.quantity;
        productSales[prodId].revenue += item.price * item.quantity;
      });
    });

    const bestSellers = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // 4. Monthly sales dataset for analytics charting (Past 6 months)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = {};

    // Initialize past 6 months with 0
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mLabel = months[d.getMonth()] + ' ' + d.getFullYear().toString().substr(-2);
      monthlyData[mLabel] = { month: mLabel, sales: 0, orders: 0 };
    }

    completedOrders.forEach(order => {
      const oDate = new Date(order.createdAt);
      const mLabel = months[oDate.getMonth()] + ' ' + oDate.getFullYear().toString().substr(-2);
      if (monthlyData[mLabel]) {
        monthlyData[mLabel].sales += order.totalPrice;
        monthlyData[mLabel].orders += 1;
      }
    });

    const salesHistory = Object.values(monthlyData);

    // 5. Recent orders
    const recentOrders = await Order.find({})
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrders,
        totalUsers,
        totalProducts,
        bestSellers,
        salesHistory,
        recentOrders
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Admin Activity Logs
// @route   GET /api/admin/logs
// @access  Private/Admin
export const getLogs = async (req, res, next) => {
  try {
    const logs = await AdminActivityLog.find({})
      .populate('admin', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    next(error);
  }
};
