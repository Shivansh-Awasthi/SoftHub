const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

// Zoho SMTP transporter
const transporter = nodemailer.createTransport({
    host: 'smtp.zoho.in',
    port: 465,
    secure: true,      // Use TLS, not SSL
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false  // Bypass SSL certificate validation
    }
});

/**
 * Send an email using nodemailer
 * @param {Object} options - { to, subject, text, html }
 * @returns {Promise}
 */
const sendEmail = async (options) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
    };
    return transporter.sendMail(mailOptions);
};

const sendOTPEmail = async (email, otp, name = 'User') => {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your OTP Code</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f7f7f7; padding: 20px; }
        .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center; color: white; }
        .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
        .tagline { font-size: 16px; opacity: 0.9; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 18px; margin-bottom: 20px; color: #555; }
        .otp-container { text-align: center; margin: 30px 0; }
        .otp-code { font-size: 42px; font-weight: bold; letter-spacing: 8px; color: #2c5aa0; background: #f8f9fa; padding: 20px; border-radius: 8px; border: 2px dashed #e9ecef; margin: 20px 0; font-family: 'Courier New', monospace; }
        .otp-expiry { color: #666; font-size: 14px; margin-top: 10px; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0; font-size: 14px; }
        .footer { background: #2c3e50; color: white; padding: 30px 20px; text-align: center; }
        .social-links { margin: 20px 0; }
        .social-links a { display: inline-block; margin: 0 10px; color: white; text-decoration: none; }
        .footer-links { margin: 15px 0; }
        .footer-links a { color: #bdc3c7; text-decoration: none; margin: 0 10px; font-size: 14px; }
        .copyright { color: #95a5a6; font-size: 12px; margin-top: 20px; }
        @media (max-width: 600px) {
            .content { padding: 20px 15px; }
            .otp-code { font-size: 32px; letter-spacing: 6px; padding: 15px; }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">TOXICGAMES</div>
            <div class="tagline">THE BEST PRE-INSTALLED GAMES PLATFORM</div>
        </div>
        
        <div class="content">
            <div class="greeting"><strong>Hello${name ? ' ' + name : ''}!</strong></div>
            
            <p>You're just one step away from accessing your account. Use the OTP below to verify your identity:</p>
            
            <div class="otp-container">
                <div class="otp-code">${otp}</div>
                <div class="otp-expiry">⏰ This OTP expires in 10 minutes</div>
            </div>
            
            <div class="warning">
                <strong>🔒 Security Alert:</strong> Never share this OTP with anyone. ToxicGames will never ask for your OTP, password, or other sensitive information.
            </div>
            
            <p>If you didn't request this OTP, please ignore this email or contact our support team immediately.</p>
        </div>
        
        <div class="footer">
            <div class="social-links">
                <a href="#">Discord</a> • 
                <a href="#">Reddit</a> • 
                <a href="#">TikTok</a>
            </div>
            
            <div class="footer-links">
                <a href="#">Email Preferences</a> • 
                <a href="https://toxicgames.in/policy">Terms of Service</a> • 
                <a hrefhttps://toxicgames.in/policyPrivacy Policy</a>
            </div>
            
            <div class="copyright">
                © 2025 ToxicGames. All rights reserved.<br>
                This email was sent to you because you initiated a verification request.
            </div>
        </div>
    </div>
</body>
</html>
    `;

    const textContent = `
ANKERGAMES - THE BEST PRE-INSTALLED GAMES PLATFORM

Hello${name ? ' ' + name : ''}!

Your One-Time Password (OTP) for account verification is:

${otp}

This OTP expires in 10 minutes.

SECURITY ALERT: Never share this OTP with anyone. AnkerGames will never ask for your OTP, password, or other sensitive information.

If you didn't request this OTP, please ignore this email or contact our support team immediately.

---
Discord | Reddit | TikTok
© 2025 AnkerGames. All rights reserved.
    `;

    return await sendEmail({
        to: email,
        subject: `Your OTP Code - ${otp}`,
        text: textContent,
        html: htmlContent
    });
};

module.exports = {
    sendEmail,
    sendOTPEmail
};
