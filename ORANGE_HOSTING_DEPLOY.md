# Deploying to Orange Hosting

## Prerequisites
- Orange Hosting account with Node.js support
- cPanel access or SSH access
- Your domain configured

## Step 1: Prepare Files

1. Update `script.js` line 606 with your domain:
   ```javascript
   : (window.ENV_API_BASE || 'https://your-domain.orangehosting.com');
   ```

2. Update `server.js` line 30 with your domain:
   ```javascript
   ? [process.env.FRONTEND_URL, 'https://your-domain.orangehosting.com']
   ```

## Step 2: Upload Files

Via FTP or cPanel File Manager, upload:
- `server.js`
- `index.html`
- `profile.html`
- `script.js`
- `profile-script.js`
- `styles.css`
- `package.json`
- All asset files (favicon.svg, etc.)

## Step 3: Configure Environment

Create `.env` file on server:
```env
PORT=5050
NODE_ENV=production
FRONTEND_URL=https://your-domain.orangehosting.com
OPENAI_API_KEY=your_key_here
```

## Step 4: Install Dependencies

Via SSH or cPanel Terminal:
```bash
npm install --production
```

## Step 5: Start the Server

### Option A: Using cPanel Node.js App
1. Go to cPanel → Setup Node.js App
2. Set Node.js version (14+)
3. Set Application root (your folder)
4. Set Application URL (your domain)
5. Set Entry point: `server.js`
6. Click "Start Application"

### Option B: Using PM2 (if SSH available)
```bash
npm install -g pm2
pm2 start server.js --name cover-letter-app
pm2 save
pm2 startup
```

### Option C: Using Node.js directly
```bash
node server.js &
```

## Step 6: Configure Apache/Nginx Proxy

Add to `.htaccess` (if using Apache):
```apache
RewriteEngine On
RewriteCond %{REQUEST_URI} !^/api/
RewriteCond %{REQUEST_URI} !^/auth/
RewriteCond %{REQUEST_URI} !^/health
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:5050/$1 [P,L]
```

## Step 7: Test

Visit your domain to test the app. Check:
- ✅ Pages load correctly
- ✅ "DB Status" shows "DB Online" (not "Local Only")
- ✅ Login/Register works
- ✅ Responses sync across devices

## Troubleshooting

### "Local Only" showing on live site
- Check Node.js server is running: `ps aux | grep node`
- Check port 5050 is accessible
- Verify CORS settings in `server.js`

### Can't connect to database
- Check SQLite permissions: `chmod 666 data.db`
- Ensure folder is writable: `chmod 755 .`

### 502 Bad Gateway
- Node.js server not running
- Port misconfigured
- Check Apache/Nginx proxy settings

## Monitoring

Keep server running with PM2:
```bash
pm2 logs cover-letter-app    # View logs
pm2 restart cover-letter-app # Restart
pm2 stop cover-letter-app    # Stop
```

## Security Notes

1. **Never commit `.env` file** - it contains secrets
2. Use strong passwords for user accounts
3. Keep Node.js and dependencies updated
4. Configure firewall to only allow necessary ports

## Support

If Orange Hosting doesn't support persistent Node.js:
- Consider using Render.com (free tier)
- Or use Netlify for frontend + separate backend host
