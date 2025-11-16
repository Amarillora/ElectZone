# 🔐 Admin Login Credentials

## Default Admin Account

To access the ElectZone Admin Dashboard, use the following credentials:

**Email:** `admin@school.edu`  
**Password:** `admin123`

---

## Access Instructions

1. **Navigate to Admin Login:**
   - Go to `/admin/login` route in your application
   - Or click the "Admin" link in the navigation bar (if available)

2. **Enter Credentials:**
   - Email: `admin@school.edu`
   - Password: `admin123`

3. **Access Dashboard:**
   - After successful login, you'll be redirected to the Admin Dashboard
   - From here you can view election results, manage voters, and monitor voting activity

---

## Admin Dashboard Features

✅ **Overview Tab:** Real-time election statistics and voter turnout  
✅ **Results Tab:** Live vote counts by position and party-list  
✅ **Voters Tab:** Complete list of registered voters and voting status  
✅ **Candidates Tab:** Manage candidate information and view details  
✅ **Audit Logs:** Track all system activities and votes (security feature)

---

## 🔒 Security Recommendations

> **⚠️ IMPORTANT FOR PRODUCTION USE:**

### Change Default Password Immediately

For production deployment, you **must** change the default admin password:

1. **Update in Database:**
   ```sql
   -- Connect to your Supabase database
   UPDATE admins 
   SET password_hash = crypt('YOUR_NEW_SECURE_PASSWORD', gen_salt('bf'))
   WHERE email = 'admin@school.edu';
   ```

2. **Create Strong Passwords:**
   - Minimum 12 characters
   - Mix of uppercase, lowercase, numbers, and symbols
   - Avoid common words or patterns

3. **Additional Security Measures:**
   - Enable Two-Factor Authentication (2FA) if available
   - Regularly rotate admin passwords
   - Monitor audit logs for suspicious activity
   - Limit admin access to trusted personnel only
   - Use HTTPS in production
   - Implement IP whitelisting if possible

---

## Additional Admin Accounts

If you need to create more admin accounts, run this SQL in your Supabase SQL Editor:

```sql
INSERT INTO admins (email, username, password_hash)
VALUES (
  'newadmin@school.edu',
  'New Admin Name',
  crypt('secure_password_here', gen_salt('bf'))
);
```

---

## Troubleshooting

**Can't log in?**
- Verify you're using the correct email format
- Check that your Supabase connection is active
- Ensure the `admins` table exists and has data
- Check browser console for any error messages

**Need to reset password?**
- Connect to Supabase SQL Editor
- Run the password update query shown above
- Clear your browser cache and try again

---

## Support

For technical issues or questions about admin access, please check:
- Supabase project dashboard for connection status
- Browser console for JavaScript errors
- Network tab for API request failures

---

**Last Updated:** January 2025  
**Version:** 1.0.0
