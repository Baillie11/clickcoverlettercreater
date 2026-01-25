# Email Alert Setup Guide

## Overview
VitaePro now sends an email alert to andrewgbaillie@hotmail.com whenever someone logs into the application.

## Setup Instructions

### 1. Configure Your Gmail Account

To send emails through Gmail, you need to create an **App Password** (not your regular Gmail password):

1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to **Security**
3. Enable **2-Step Verification** (if not already enabled)
4. Go to **App Passwords** (search for it in the security page)
5. Create a new app password:
   - Select app: **Mail**
   - Select device: **Other (Custom name)** → Enter "VitaePro"
6. Google will generate a 16-character password
7. Copy this password (you won't be able to see it again)

### 2. Update Your .env File

Open your `.env` file and update the email configuration:

```env
# ============ EMAIL ALERTS ============
EMAIL_SERVICE=gmail
EMAIL_USER=your-actual-email@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
ALERT_EMAIL=andrewgbaillie@hotmail.com
```

Replace:
- `your-actual-email@gmail.com` with your Gmail address
- `your-16-character-app-password` with the app password you generated

### 3. Restart the Server

After updating the `.env` file, restart your server:

```bash
npm start
```

You should see: `📧 Email alerts configured` in the console when the server starts.

## Testing

1. Log into your VitaePro application
2. Check andrewgbaillie@hotmail.com for the alert email
3. The email will contain:
   - Username
   - User ID
   - Login timestamp
   - Confirmation message

## Troubleshooting

### Email not configured message
If you see `⚠️ Email alerts not configured`, check:
- EMAIL_USER and EMAIL_PASSWORD are set in .env
- No extra spaces in the values
- The .env file is in the root directory

### Emails not sending
If configured but emails aren't arriving:
- Verify the app password is correct
- Check your Gmail account hasn't blocked the app
- Look for error messages in the server console
- Check spam folder in andrewgbaillie@hotmail.com

### Alternative Email Providers

If you don't want to use Gmail, you can use other services:

**Outlook/Hotmail:**
```env
EMAIL_SERVICE=hotmail
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

**Custom SMTP:**
```env
EMAIL_SERVICE=
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-password
```

For custom SMTP, you'll need to modify the nodemailer configuration in server.js.

## Security Note

- Never commit your .env file to version control
- Keep your app password secure
- The email is sent asynchronously so it won't slow down logins
- If email sending fails, the login will still succeed (fail-safe design)
