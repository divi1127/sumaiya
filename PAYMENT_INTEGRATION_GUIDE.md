# Payment System Integration Guide

## Quick Integration Checklist

### 1. Router Integration

**File:** `client/src/router/AppRouter.jsx` (or your main router file)

Add these routes to your router configuration:

```jsx
// Customer Routes
import PaymentVerificationPage from '../pages/User/PaymentVerificationPage';

// Admin Routes
import PaymentManagement from '../pages/Admin/PaymentManagement';
import PaymentSettings from '../pages/Admin/PaymentSettings';

// Inside your router component:
<Routes>
  {/* ... existing routes ... */}
  
  {/* Customer Payment Routes */}
  <Route 
    path="/payment-verification/:orderId" 
    element={<ProtectedRoutes><PaymentVerificationPage /></ProtectedRoutes>} 
  />
  
  {/* Admin Payment Routes */}
  <Route 
    path="/admin/payment-settings" 
    element={<ProtectedRoutes adminOnly><PaymentSettings /></ProtectedRoutes>} 
  />
  <Route 
    path="/admin/payment-management" 
    element={<ProtectedRoutes adminOnly><PaymentManagement /></ProtectedRoutes>} 
  />
  
  {/* ... rest of routes ... */}
</Routes>
```

### 2. Admin Navigation Update

**File:** `client/src/components/common/Navbar.jsx` or Admin sidebar

Add navigation links:

```jsx
// In admin menu/sidebar
<Link to="/admin/payment-settings" className="nav-link">
  💳 Payment Settings
</Link>

<Link to="/admin/payment-management" className="nav-link">
  🔍 Payment Verification
</Link>
```

### 3. Check Dependencies

Ensure these packages are installed in `client/package.json`:

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-router-dom": "^6.0.0",
    "axios": "^1.0.0",
    "framer-motion": "^10.0.0",
    "lucide-react": "^0.0.0",
    "redux": "^4.0.0",
    "react-redux": "^8.0.0"
  }
}
```

If any are missing, install them:
```bash
npm install framer-motion lucide-react axios
```

### 4. Server Configuration

**File:** `server/index.js`

Verify the import and route are added:

```javascript
// Import (should be already added)
import paymentRoutes from './routes/paymentRoutes.js';

// Route (should be already added)
app.use('/api/payment', paymentRoutes);
```

### 5. File Upload Configuration

Create/verify upload directory:

```bash
# Create uploads directory at project root
mkdir -p uploads/payment-screenshots
```

Ensure middleware is configured in `server/middleware/uploadMiddleware.js`:

```javascript
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Create directory if doesn't exist
const uploadDir = 'uploads/payment-screenshots';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

export const uploadMiddleware = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});
```

### 6. Environment Variables

Add to `.env` file:

```env
# Payment Configuration
PAYMENT_UPLOAD_DIR=uploads/payment-screenshots
MAX_UPLOAD_SIZE=5242880

# Email Configuration (for notifications)
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-password
ADMIN_EMAIL=admin@yourstore.com
```

### 7. Email Notifications Setup

Verify `server/utils/sendEmail.js` is configured:

```javascript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject,
      html
    });
  } catch (error) {
    console.error('Email send error:', error);
  }
};
```

### 8. Redux Store (if using for order updates)

Update `client/src/redux/slices/orderSlice.js`:

```javascript
// Make sure to handle payment status in order state
// This is optional if you're just using API calls

export const orderSlice = createSlice({
  name: 'orders',
  initialState: {
    orders: [],
    currentOrder: null,
    paymentStatus: null // Add if needed
  },
  reducers: {
    // ... existing reducers ...
    setPaymentStatus: (state, action) => {
      if (state.currentOrder) {
        state.currentOrder.paymentStatus = action.payload;
      }
    }
  }
});
```

### 9. Testing the Payment Flow

**Customer Side:**
1. Go to checkout page
2. Select "UPI Payment" option
3. Verify payment settings load (UPI ID, QR code shown)
4. Click "Secure Pay" button
5. Should redirect to PaymentVerificationPage
6. Upload screenshot and UTR
7. Verify order status changes to "Payment Verification Pending"

**Admin Side:**
1. Navigate to Payment Management
2. Should see pending orders
3. Click view details on order
4. Should show payment screenshot
5. Click Approve to test workflow
6. Verify order status changes to "Paid" and "Processing"

**Payment Settings:**
1. Navigate to Payment Settings
2. Edit UPI ID, name, instructions
3. Upload/change QR code
4. Save settings
5. Go to checkout and verify new settings appear

### 10. Troubleshooting

**Issue:** API endpoints return 404
- **Solution:** Verify payment routes are imported and added in `server/index.js`

**Issue:** File upload fails
- **Solution:** Check upload directory exists and has write permissions

**Issue:** UPI payment component not showing
- **Solution:** Verify imports in CheckoutPage.jsx and component paths

**Issue:** Admin payment pages not accessible
- **Solution:** Check router configuration and admin role protection

**Issue:** Email notifications not sending
- **Solution:** Verify SMTP configuration and sendEmail utility

---

## Verification Checklist

- [ ] All new files created successfully
- [ ] Routes imported in main router
- [ ] Admin navigation updated
- [ ] Payment settings fetched at checkout
- [ ] UPI option appears in payment methods
- [ ] Payment verification page loads after order
- [ ] Upload form works
- [ ] Admin panel displays orders
- [ ] Approve/Reject actions work
- [ ] Order status updates correctly
- [ ] Email notifications sent
- [ ] File upload directory created
- [ ] No console errors

---

## Common Issues & Solutions

### QR Code Not Displaying
- Ensure file is uploaded to correct directory
- Check file URL format matches upload path
- Verify image MIME type is correct

### Payment Proof Upload Fails
- Check file size (max 5MB)
- Verify file is an image
- Check upload directory permissions
- Verify multer middleware is configured

### Admin Can't Approve/Reject
- Check admin role in auth token
- Verify orderSlice has payment status fields
- Check API response for error message

### Notifications Not Working
- Configure SMTP settings in .env
- Test email credentials
- Check sendEmail utility implementation
- Verify email template HTML is valid

---

## Performance Optimization

1. **Lazy Load Payment Components:**
```jsx
const PaymentVerificationPage = lazy(() => 
  import('../pages/User/PaymentVerificationPage')
);
```

2. **Image Optimization:**
- Compress QR code image (should be < 100KB)
- Resize payment screenshots on upload
- Use WebP format for faster loading

3. **Query Optimization:**
- Add indexes to paymentStatus in Order model
- Paginate large order lists
- Cache payment settings

---

## Security Hardening

1. **Rate Limiting on Upload:**
```javascript
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10 // 10 uploads per 15 minutes
});

router.post('/upload-proof', uploadLimiter, uploadPaymentProof);
```

2. **Virus Scanning:**
```javascript
import ClamScan from 'clamscan';
// Scan uploaded files before saving
```

3. **HTTPS Only:**
```javascript
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});
```

---

## Next Steps

1. ✅ Run through integration checklist
2. ✅ Test complete payment flow
3. ✅ Configure email notifications
4. ✅ Setup file upload directory
5. ✅ Deploy to staging environment
6. ✅ Get admin approval
7. ✅ Deploy to production

---

Good luck! 🚀
