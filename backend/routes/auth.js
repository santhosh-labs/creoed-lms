const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// @route   POST api/auth/login
// @desc    Authenticate user & get token — accepts email OR studentCode
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }

    try {
        // Allow login via Email OR StudentCode
        const [rows] = await pool.query(`
            SELECT u.ID, u.StudentCode, u.Name, u.Email, u.PasswordHash, u.RoleID, r.RoleName
            FROM Users u
            JOIN Roles r ON u.RoleID = r.ID
            WHERE u.Email = ? OR u.StudentCode = ?
        `, [email, email.toUpperCase()]);

        if (rows.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.PasswordHash);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const payload = {
            id: user.ID,
            email: user.Email,
            roleId: user.RoleID,
            role: user.RoleName
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: 3600 * 24 }, // 1 day
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    user: {
                        id: user.ID,
                        studentCode: user.StudentCode,
                        name: user.Name,
                        email: user.Email,
                        role: user.RoleName
                    }
                });
            }
        );
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/auth/me
// @desc    Get user data
// @access  Private
router.get('/me', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT u.ID, u.StudentCode, u.Name, u.Email, u.Phone, u.DateOfBirth, u.Gender, u.City, u.Country, u.CollegeName, r.RoleName
            FROM Users u
            JOIN Roles r ON u.RoleID = r.ID
            WHERE u.ID = ?
        `, [req.user.id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Handle email sending
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for port 465, false for 587
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: false // allow self-signed certs
    }
});

// Verify SMTP connection on startup
transporter.verify((error) => {
    if (error) {
        console.error('⚠️  SMTP connection FAILED:', error.message);
        console.error('   Check SMTP_USER and SMTP_PASS in your .env file');
    } else {
        console.log('✅ SMTP server connected — email sending ready');
    }
});

// @route   POST api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    try {
        const [rows] = await pool.query(`SELECT ID, Name FROM Users WHERE Email = ?`, [email]);
        if (rows.length === 0) {
            // Return success even if not found to prevent email enumeration
            return res.json({ message: 'If that email exists, a reset link has been sent.' });
        }

        const user = rows[0];
        const resetToken = crypto.randomBytes(32).toString('hex');
        
        // Save token to DB, valid for 1 hour
        const expiry = new Date(Date.now() + 3600000); // 1 hour from now

        await pool.query(
            `UPDATE Users SET ResetToken = ?, ResetTokenExpiry = ? WHERE ID = ?`,
            [resetToken, expiry, user.ID]
        );

        // Link to frontend reset page
        // Format: http://localhost:5173/reset-password/TOKEN
        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

        const now = new Date();
        const expiryTime = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short', year: 'numeric' });

        const mailOptions = {
            from: `"Creoed LMS" <${process.env.SMTP_USER}>`,
            to: email,
            subject: '🔐 Password Reset Request — Creoed LMS',
            html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Password Reset</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#1aae64 0%,#0d8a4f 100%);border-radius:16px 16px 0 0;padding:40px 48px;text-align:center;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:14px;padding:12px 20px;margin-bottom:16px;">
                      <span style="color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">C Creoed</span>
                    </div>
                    <br/>
                    <span style="color:rgba(255,255,255,0.85);font-size:14px;letter-spacing:1px;text-transform:uppercase;font-weight:500;">Learning Management System</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- BODY CARD -->
          <tr>
            <td style="background:#ffffff;padding:48px;border-left:1px solid #e8f0eb;border-right:1px solid #e8f0eb;">

              <!-- Lock Icon -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:28px;">
                    <div style="width:64px;height:64px;background:linear-gradient(135deg,#e8f8f0,#d0f0e0);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:28px;line-height:64px;text-align:center;">🔐</div>
                  </td>
                </tr>
              </table>

              <h1 style="color:#1a2e22;font-size:26px;font-weight:800;margin:0 0 8px;text-align:center;">Reset Your Password</h1>
              <p style="color:#6b7c75;font-size:15px;text-align:center;margin:0 0 36px;line-height:1.5;">We received a request to reset your Creoed LMS account password.</p>

              <!-- Greeting -->
              <p style="color:#374151;font-size:16px;margin:0 0 16px;line-height:1.6;">Hello <strong style="color:#1a2e22;">${user.Name}</strong>,</p>
              <p style="color:#4b5563;font-size:15px;line-height:1.7;margin:0 0 36px;">
                Someone (hopefully you!) requested a password reset for your account registered with <strong>${email}</strong>. 
                Click the button below to securely set a new password. This link will expire in <strong>1 hour</strong>.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:36px;">
                <tr>
                  <td align="center">
                    <a href="${resetLink}"
                       style="display:inline-block;background:linear-gradient(135deg,#1aae64,#0d8a4f);color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:16px 48px;border-radius:12px;letter-spacing:0.3px;box-shadow:0 4px 14px rgba(26,174,100,0.35);">
                      Reset My Password
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #e5ebe8;margin:0 0 28px;"/>

              <!-- Fallback Link -->
              <p style="color:#6b7c75;font-size:13px;margin:0 0 8px;">Button not working? Copy and paste this link into your browser:</p>
              <p style="background:#f8fffe;border:1px solid #d0ece0;border-radius:8px;padding:12px 16px;font-size:12px;color:#0d8a4f;word-break:break-all;margin:0 0 28px;font-family:monospace;">${resetLink}</p>

              <!-- Warning -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:16px 20px;">
                    <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
                      ⚠️ <strong>Didn't request this?</strong> You can safely ignore this email — your password will remain unchanged. 
                      If you're concerned about your account security, please contact support.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#f8fffe;border:1px solid #e8f0eb;border-top:none;border-radius:0 0 16px 16px;padding:28px 48px;text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;color:#6b7c75;">This email was sent from <strong>Creoed LMS</strong> • no-reply@creoed.com</p>
              <p style="margin:0;font-size:12px;color:#9ca3af;">Link expires at ${expiryTime} IST &nbsp;|&nbsp; © ${new Date().getFullYear()} Creoed. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
            `
        };

        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.error('Email not sent: SMTP_USER and SMTP_PASS not configured in .env');
            // Still return success but log the reset link in the terminal
            console.log('🔗 RESET LINK (copy this):', resetLink);
            return res.json({ message: 'If that email exists, a reset link has been sent.' });
        }

        try {
            await transporter.sendMail(mailOptions);
            console.log('✅ Reset email sent to:', email);
        } catch (mailErr) {
            console.error('❌ Email send error:', mailErr.message);
            // Log the link to terminal as fallback
            console.log('🔗 RESET LINK (copy this as fallback):', resetLink);
            return res.status(500).json({ message: 'Failed to send email. Please check SMTP settings. Contact admin for help.' });
        }

        res.json({ message: 'If that email exists, a reset link has been sent.' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/auth/reset-password
// @desc    Reset password using token
// @access  Public
router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) return res.status(400).json({ message: 'Missing fields' });

    try {
        const [rows] = await pool.query(`
            SELECT ID, ResetTokenExpiry FROM Users WHERE ResetToken = ?
        `, [token]);

        if (rows.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        const user = rows[0];
        if (new Date() > new Date(user.ResetTokenExpiry)) {
            return res.status(400).json({ message: 'Token has expired' });
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPassword, salt);

        await pool.query(`
            UPDATE Users SET PasswordHash = ?, ResetToken = NULL, ResetTokenExpiry = NULL WHERE ID = ?
        `, [hash, user.ID]);

        res.json({ message: 'Password has been reset successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
