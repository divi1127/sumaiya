# Payment System API Testing Guide

## Prerequisites
- Postman or similar API testing tool
- Server running on `http://localhost:5000`
- Valid authentication token (JWT)
- Admin user account

---

## 1. Payment Settings Endpoints

### Get Payment Settings (Public)
```http
GET http://localhost:5000/api/payment/settings
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "_id": "64abc123def456ghi789jkl",
    "upiId": "6374383385@ybl",
    "qrCode": "https://your-domain.com/uploads/qr-code.png",
    "accountHolderName": "Store Name",
    "paymentInstructions": "Transfer exact amount only",
    "isActive": true,
    "createdAt": "2024-06-01T10:00:00.000Z",
    "updatedAt": "2024-06-01T10:00:00.000Z"
  }
}
```

### Update Payment Settings (Admin)
```http
PUT http://localhost:5000/api/payment/settings
Content-Type: multipart/form-data
Authorization: Bearer YOUR_TOKEN
```

**Request Body (Form Data):**
- `upiId` (text): "6374383385@ybl"
- `accountHolderName` (text): "Store Name"
- `paymentInstructions` (text): "Transfer exact amount"
- `isActive` (text): "true"
- `qrCode` (file): Select QR code image

**Expected Response:**
```json
{
  "success": true,
  "message": "Payment settings updated successfully",
  "data": {
    "_id": "64abc123def456ghi789jkl",
    "upiId": "6374383385@ybl",
    "qrCode": "https://your-domain.com/uploads/qr-123456.png",
    "accountHolderName": "Store Name",
    "paymentInstructions": "Transfer exact amount",
    "isActive": true
  }
}
```

---

## 2. Payment Proof Upload (Customer)

### Upload Payment Proof
```http
POST http://localhost:5000/api/payment/upload-proof
Content-Type: multipart/form-data
Authorization: Bearer YOUR_TOKEN
```

**Request Body (Form Data):**
- `orderId` (text): "507f1f77bcf86cd799439011"
- `utrNumber` (text): "202406011234567890"
- `paymentScreenshot` (file): Select payment screenshot image

**Expected Response (Success):**
```json
{
  "success": true,
  "message": "Payment proof uploaded successfully. Awaiting admin verification",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "user": "507f1f77bcf86cd799439012",
    "orderItems": [...],
    "paymentStatus": "Payment Verification Pending",
    "utrNumber": "202406011234567890",
    "paymentScreenshot": "https://your-domain.com/uploads/payment-123456.jpg",
    "orderStatus": "Pending"
  }
}
```

**Expected Response (Error - No screenshot):**
```json
{
  "success": false,
  "message": "Payment screenshot is required"
}
```

**Expected Response (Error - Wrong order):**
```json
{
  "success": false,
  "message": "Unauthorized: This order does not belong to you"
}
```

---

## 3. Admin Payment Management

### Get Pending Payment Orders
```http
GET http://localhost:5000/api/payment/orders/pending-verification?page=1&limit=10&searchTerm=
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `searchTerm` (string): Search by email, UTR, or order ID

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "user": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "9876543210"
      },
      "totalPrice": 1500,
      "paymentStatus": "Payment Verification Pending",
      "utrNumber": "202406011234567890",
      "paymentScreenshot": "https://...",
      "orderStatus": "Pending",
      "createdAt": "2024-06-01T10:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 25,
    "pages": 3,
    "currentPage": 1,
    "limit": 10
  }
}
```

### Get All Orders with Payment
```http
GET http://localhost:5000/api/payment/orders/all?page=1&paymentStatus=Paid&orderStatus=&searchTerm=
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Query Parameters:**
- `page` (number): Page number
- `paymentStatus` (string): "Paid", "Rejected", "Pending Payment", or "Payment Verification Pending"
- `orderStatus` (string): "Pending", "Processing", "Shipped", etc.
- `searchTerm` (string): Search term
- `limit` (number): Items per page

### Get Order Payment Details
```http
GET http://localhost:5000/api/payment/orders/507f1f77bcf86cd799439011/details
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "user": {
      "name": "John Doe",
      "email": "john@example.com"
    },
    "orderItems": [
      {
        "product": {...},
        "name": "Product Name",
        "quantity": 2,
        "price": 750
      }
    ],
    "totalPrice": 1500,
    "paymentStatus": "Payment Verification Pending",
    "paymentScreenshot": "https://...",
    "utrNumber": "202406011234567890",
    "shippingAddress": {...}
  }
}
```

### Approve Payment
```http
POST http://localhost:5000/api/payment/approve
Content-Type: application/json
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Request Body:**
```json
{
  "orderId": "507f1f77bcf86cd799439011"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Payment approved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "paymentStatus": "Paid",
    "orderStatus": "Processing"
  }
}
```

**Error Response (Order not pending):**
```json
{
  "success": false,
  "message": "Order is not pending payment verification"
}
```

### Reject Payment
```http
POST http://localhost:5000/api/payment/reject
Content-Type: application/json
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Request Body:**
```json
{
  "orderId": "507f1f77bcf86cd799439011",
  "rejectionReason": "Payment amount does not match order total"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Payment rejected successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "paymentStatus": "Rejected",
    "rejectionReason": "Payment amount does not match order total"
  }
}
```

---

## 4. Analytics & Statistics

### Get Payment Statistics
```http
GET http://localhost:5000/api/payment/statistics
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "totalOrders": 150,
    "pendingPayments": 10,
    "verificationPending": 5,
    "verifiedPayments": 130,
    "rejectedPayments": 5,
    "totalRevenue": 450000,
    "monthlyRevenue": [
      {
        "_id": {
          "year": 2024,
          "month": 6
        },
        "revenue": 125000,
        "count": 50
      },
      {
        "_id": {
          "year": 2024,
          "month": 5
        },
        "revenue": 150000,
        "count": 60
      }
    ]
  }
}
```

### Get Recent Transactions
```http
GET http://localhost:5000/api/payment/recent-transactions?limit=10
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Query Parameters:**
- `limit` (number): Number of recent transactions to fetch

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "user": {
        "name": "John Doe",
        "email": "john@example.com"
      },
      "totalPrice": 1500,
      "paymentStatus": "Paid",
      "orderStatus": "Processing",
      "createdAt": "2024-06-01T15:30:00.000Z",
      "utrNumber": "202406011234567890"
    }
  ]
}
```

---

## Postman Collection

Save this as `payment-api.postman_collection.json`:

```json
{
  "info": {
    "name": "Payment System API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Payment Settings",
      "item": [
        {
          "name": "Get Settings",
          "request": {
            "method": "GET",
            "url": "{{baseUrl}}/api/payment/settings"
          }
        },
        {
          "name": "Update Settings",
          "request": {
            "method": "PUT",
            "url": "{{baseUrl}}/api/payment/settings",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ]
          }
        }
      ]
    },
    {
      "name": "Payment Operations",
      "item": [
        {
          "name": "Upload Payment Proof",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/api/payment/upload-proof",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ]
          }
        },
        {
          "name": "Get Pending Orders",
          "request": {
            "method": "GET",
            "url": "{{baseUrl}}/api/payment/orders/pending-verification",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ]
          }
        },
        {
          "name": "Approve Payment",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/api/payment/approve",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ]
          }
        },
        {
          "name": "Reject Payment",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/api/payment/reject",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ]
          }
        }
      ]
    },
    {
      "name": "Statistics",
      "item": [
        {
          "name": "Get Statistics",
          "request": {
            "method": "GET",
            "url": "{{baseUrl}}/api/payment/statistics",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ]
          }
        },
        {
          "name": "Get Recent Transactions",
          "request": {
            "method": "GET",
            "url": "{{baseUrl}}/api/payment/recent-transactions",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ]
          }
        }
      ]
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:5000"
    },
    {
      "key": "token",
      "value": "your-auth-token-here"
    }
  ]
}
```

---

## Testing Workflow

1. **Get Payment Settings** (Public)
   - Verify QR code and UPI ID are returned

2. **Update Payment Settings** (Admin)
   - Upload new QR code
   - Update UPI ID
   - Verify settings saved

3. **Create Order with UPI** (Customer)
   - Place order with UPI payment method
   - Verify order status is "Pending Payment"

4. **Upload Payment Proof** (Customer)
   - Upload screenshot
   - Enter UTR number
   - Verify status becomes "Payment Verification Pending"

5. **Get Pending Orders** (Admin)
   - Retrieve orders awaiting verification
   - Should show the order created above

6. **Approve Payment** (Admin)
   - Approve the pending order
   - Verify status becomes "Paid"
   - Verify order status becomes "Processing"

7. **Get Statistics** (Admin)
   - Check total orders increased
   - Check verified payments increased

---

## Common Test Scenarios

### Scenario 1: Successful Payment Flow
1. ✅ Get settings
2. ✅ Create order
3. ✅ Upload proof
4. ✅ Admin approves
5. ✅ Check status updated

### Scenario 2: Rejected Payment
1. ✅ Get settings
2. ✅ Create order
3. ✅ Upload proof
4. ✅ Admin rejects with reason
5. ✅ Customer re-uploads
6. ✅ Admin approves

### Scenario 3: Payment Settings Management
1. ✅ Update UPI ID
2. ✅ Change QR code
3. ✅ Disable payment
4. ✅ Enable payment
5. ✅ Verify changes appear at checkout

---

## Error Handling Test

| Error | Expected Status | Fix |
|-------|-----------------|-----|
| Invalid Order ID | 404 | Use valid order ID |
| Unauthorized Order | 403 | Use customer's own order |
| Missing Screenshot | 400 | Upload image file |
| Invalid File Type | 400 | Upload image only |
| File Too Large | 400 | Use file < 5MB |
| Missing UTR | 400 | Enter UTR number |
| No Auth Token | 401 | Include Bearer token |
| Admin Only | 403 | Use admin token |

---

Happy Testing! 🚀
