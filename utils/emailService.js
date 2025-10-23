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

module.exports = sendEmail;
