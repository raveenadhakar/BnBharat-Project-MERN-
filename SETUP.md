
## 1. Razorpay Payment Integration

### Get Test Keys (Free)
1. Go to [razorpay.com](https://razorpay.com) → Sign up (free)
2. Dashboard → Settings → API Keys → Generate Test Keys
3. Copy `Key ID` and `Key Secret`
4. Add to `.env`:
   ```
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
   ```

### Test Cards (no real money charged)
| Card Number       | CVV | Expiry |
|-------------------|-----|--------|
| 4111 1111 1111 1111 | Any | Any future date |
| 5267 3181 8797 5449 | 123 | Any future date |

UPI Test ID: `success@razorpay`


## 3. RabbitMQ (Booking Confirmation Emails)

### Gmail App Password (for sending emails)
1. Google Account → Security → 2-Step Verification → ON
2. Security → App Passwords → Generate
3. Add to `.env`:
   ```
   EMAIL_USER=your@gmail.com
   EMAIL_PASS=xxxx xxxx xxxx xxxx
   ```




Visit: http://localhost:9080
