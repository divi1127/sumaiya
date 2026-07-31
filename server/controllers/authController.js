import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { sendEmail } from '../utils/sendEmail.js';

// @desc    Register a new user directly
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
  const { name, email, password, phno, address } = req.body;
  const normalizedEmail = email ? email.toLowerCase().trim() : '';

  try {
    const userExists = await User.findOne({ email: normalizedEmail });

    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create the user directly
    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      phno,
      addresses: address && address.street ? [address] : []
    });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phno: user.phno,
        addresses: user.addresses,
        referralCode: user.referralCode,
        token: generateToken(user._id)
      }
    });

    // Send welcome email (non-blocking)
    sendEmail({
      to: user.email,
      subject: 'Welcome to Sumaiya\'99 – Your Account is Ready!',
      html: `

<div style="max-width:680px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#ffffff;color:#111827;border-radius:24px;overflow:hidden;">

  <div style="padding:60px 40px;text-align:center;background:#f8fafc;">
    <span style="display:inline-block;padding:8px 18px;border:1px solid #e5e7eb;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:2px;color:#6366f1;">
      PREMIUM FASHION EXPERIENCE
    </span>


<h1 style="font-size:42px;font-weight:900;margin:24px 0 12px;">
  Welcome to Sumaiya'99
</h1>

<p style="color:#6b7280;font-size:16px;line-height:1.8;max-width:500px;margin:0 auto;">
  Discover premium collections crafted for modern elegance and timeless style.
</p>


  </div>

  <div style="padding:40px;">
    <h2 style="margin:0 0 15px;font-size:28px;">
      Hi ${user.name} 👋
    </h2>


<p style="color:#64748b;line-height:1.8;font-size:15px;">
  Thank you for joining Sumaiya'99. Your account has been successfully created and you're now part of our exclusive fashion community.
</p>

<div style="margin-top:30px;background:#111827;border-radius:18px;padding:24px;">
  <h3 style="margin:0 0 20px;color:#a5b4fc;font-size:13px;letter-spacing:2px;text-transform:uppercase;">
    Account Details
  </h3>

  <p style="margin:8px 0;color:#ffffff;">
    <strong>Name:</strong> ${user.name}
  </p>

  <p style="margin:8px 0;color:#ffffff;">
    <strong>Email:</strong> ${user.email}
  </p>
</div>



<div style="margin-top:35px;">
  <h3 style="font-size:24px;margin-bottom:20px;">
    Member Benefits
  </h3>

  <table width="100%" cellspacing="10">
    <tr>
      <td style="background:#f8fafc;padding:20px;border-radius:12px;">
        ✨ Exclusive Collections
      </td>

      <td style="background:#f8fafc;padding:20px;border-radius:12px;">
        🚚 Fast Delivery
      </td>
    </tr>

    <tr>
      <td style="background:#f8fafc;padding:20px;border-radius:12px;">
        🎁 Member Rewards
      </td>

      <td style="background:#f8fafc;padding:20px;border-radius:12px;">
        💎 Premium Support
      </td>
    </tr>
  </table>
</div>

<div style="text-align:center;margin-top:40px;">
  <a
    href="${process.env.CLIENT_URL}/products"
    style="display:inline-block;background:#111827;color:white;text-decoration:none;padding:18px 40px;border-radius:999px;font-weight:700;"
  >
    Explore Collection →
  </a>
</div>


  </div>

  <div style="background:#111827;padding:35px;text-align:center;">
    <h3 style="margin:0;color:white;">
      Sumaiya'99
    </h3>


<p style="margin:12px 0;color:#9ca3af;">
  Fashion Crafted With Elegance
</p>

<p style="margin:0;color:#6b7280;font-size:12px;">
  © ${new Date().getFullYear()} Sumaiya'99. All Rights Reserved.
</p>


  </div>

</div>
`

      
    }).catch(err => console.error('Welcome email failed:', err));

  } catch (error) {
    next(error);
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password');

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phno: user.phno,
          addresses: user.addresses,
          referralCode: user.referralCode,
          token: generateToken(user._id)
        }
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phno: user.phno,
          addresses: user.addresses,
          referralCode: user.referralCode
        }
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile / addresses
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.phno = req.body.phno || user.phno;

      // Handle address updates if provided
      if (req.body.addresses) {
        user.addresses = req.body.addresses;
      }

      const updatedUser = await user.save();

      res.json({
        success: true,
        data: {
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          phno: updatedUser.phno,
          addresses: updatedUser.addresses,
          referralCode: updatedUser.referralCode,
          token: generateToken(updatedUser._id)
        }
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Change user password
// @route   PUT /api/auth/password
// @access  Private
export const changePassword = async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user._id).select('+password');

    if (user && (await bcrypt.compare(currentPassword, user.password))) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      await user.save();

      res.json({
        success: true,
        message: 'Password updated successfully'
      });
    } else {
      res.status(400);
      throw new Error('Incorrect current password');
    }
  } catch (error) {
    next(error);
  }
};
