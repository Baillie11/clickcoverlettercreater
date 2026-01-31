# Secure Password Reset - Setup Guide

## Overview
The password reset functionality has been upgraded with a secure two-factor authentication (2FA) flow using email verification.

## Security Improvements
✅ **Two-step verification process** - Users must verify their email address before resetting password
✅ **Time-limited tokens** - Reset tokens expire after 30 minutes
✅ **Single-use tokens** - Each token can only be used once
✅ **User enumeration prevention** - Same response regardless of whether email exists
✅ **Session invalidation** - All existing sessions are cleared after password reset
✅ **Confirmation emails** - Users receive email notification after password change

## How It Works

### Step 1: Request Reset Token
1. User clicks "Forgot Password?" on the login page
2. User enters their email address
3. System generates a secure 64-character random token
4. Token is stored in database with 30-minute expiry
5. Email sent to user with reset token
6. User is moved to Step 2

### Step 2: Confirm Reset with Token
1. User enters the token from their email
2. User enters and confirms new password
3. System validates token (not expired, not used, exists)
4. Password is updated and hashed
5. Token is marked as used
6. All user sessions are deleted (forces re-login)
7. Confirmation email sent to user

## Email Configuration

To enable password reset emails, update your `.env` file with your email credentials:

```env
# Gmail Configuration (Recommended)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# For production, also set the app URL
APP_URL=https://yourdomain.com
```

### Gmail App Password Setup
1. Go to your Google Account settings
2. Enable 2-Factor Authentication if not already enabled
3. Go to Security > 2-Step Verification > App Passwords
4. Generate an App Password for "Mail"
5. Use this app password (not your regular password) in `EMAIL_PASSWORD`

### Other Email Services
You can use other email services by changing `EMAIL_SERVICE`:
- `outlook` for Outlook/Hotmail
- `yahoo` for Yahoo
- Or configure custom SMTP settings in `server.js`

## Database Changes

The implementation automatically creates a new table: `password_reset_tokens`

**SQLite Schema:**
```sql
CREATE TABLE password_reset_tokens (
  token TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  expiresAt TEXT NOT NULL,
  used INTEGER DEFAULT 0,
  FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
)
```

**MySQL Schema:**
```sql
CREATE TABLE password_reset_tokens (
  token VARCHAR(100) PRIMARY KEY,
  userId VARCHAR(50) NOT NULL,
  createdAt DATETIME NOT NULL,
  expiresAt DATETIME NOT NULL,
  used TINYINT DEFAULT 0,
  INDEX idx_userId (userId),
  INDEX idx_expiresAt (expiresAt),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
)
```

The table is created automatically when the server starts.

## API Endpoints

### POST /auth/request-password-reset
Request a password reset token.

**Request Body:**
```json
{
  "username": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "If an account with that email exists, a password reset email has been sent."
}
```

**Note:** Always returns success to prevent user enumeration attacks.

### POST /auth/confirm-password-reset
Confirm password reset with token.

**Request Body:**
```json
{
  "token": "64-character-hex-token",
  "newPassword": "newpassword123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Password has been reset successfully. Please log in with your new password."
}
```

**Response (Error):**
```json
{
  "error": "Invalid or expired reset token"
}
```

## Testing the Feature

1. **Start the server:**
   ```bash
   node server.js
   ```

2. **Configure email in `.env`** (required for full testing)

3. **Test the flow:**
   - Open your browser to `http://localhost:3050`
   - Click "Forgot Password?"
   - Enter your email address
   - Check your email for the reset token
   - Enter the token and new password
   - Verify you can log in with the new password

4. **Verify security:**
   - Try using the same token twice (should fail)
   - Wait 30+ minutes and try using an old token (should fail)
   - Verify all sessions are logged out after password reset

## Email Templates

### Password Reset Request Email
Users receive an email with:
- The reset token (64-character hex string)
- A clickable link (if `APP_URL` is configured)
- 30-minute expiry warning
- Security notice

### Password Changed Confirmation Email
Users receive a confirmation email with:
- Timestamp of password change
- Security warning if they didn't make the change

## Troubleshooting

### Emails not sending
- Check `.env` has correct `EMAIL_USER` and `EMAIL_PASSWORD`
- For Gmail, ensure you're using an App Password, not your regular password
- Check server console for email error messages
- Verify firewall isn't blocking port 587 (SMTP)

### Token expired errors
- Tokens expire after 30 minutes for security
- Request a new token if expired

### Token already used errors
- Each token can only be used once
- Request a new token if needed

### User enumeration concerns
- The system always returns the same message regardless of whether the email exists
- This prevents attackers from discovering valid email addresses

## Security Best Practices

1. **Never log tokens** - Tokens are sensitive and should never be logged or displayed
2. **Short token lifetime** - 30 minutes is recommended
3. **Rate limiting** - Consider adding rate limiting to prevent spam
4. **HTTPS only** - Always use HTTPS in production to prevent token interception
5. **Clear sessions** - All sessions are cleared after password reset
6. **Email notifications** - Users are notified of password changes

## Migration from Old System

The old insecure `/auth/reset-password` endpoint has been removed and replaced with the two-step flow. Users who try to use old integrations will get a 404 error and should be updated to use the new endpoints.

## Production Considerations

1. **Set APP_URL** in `.env` to your production domain
2. **Use a dedicated email account** for sending reset emails
3. **Monitor email delivery** to ensure users receive tokens
4. **Consider adding rate limiting** to prevent abuse
5. **Set up email alerts** for unusual password reset activity
6. **Regularly clean up expired tokens** (done automatically on each request)

## Support

If you encounter any issues with the password reset feature:
1. Check server console logs for error messages
2. Verify email configuration in `.env`
3. Test email sending with a simple test message
4. Check database for stored tokens
5. Review this documentation for configuration steps
