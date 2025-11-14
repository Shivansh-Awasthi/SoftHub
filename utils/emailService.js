const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();



console.log('EMAIL USER:', process.env.EMAIL_USER);
console.log('EMAIL PASS:', process.env.EMAIL_PASS ? 'loaded' : 'missing');
// Hostija SMTP transporte
const transporter = nodemailer.createTransport({
    host: 'mail.toxicgame.net', // Not smtp.zoho.in
    port: 587,                  // TLS (STARTTLS) port
    secure: false,              // false for 587 (STARTTLS)
    auth: {
        user: process.env.EMAIL_USER,  // no-reply@toxicgame.net
        pass: process.env.EMAIL_PASS,  // class7thE.
    },
    tls: {
        rejectUnauthorized: false
    }
});

// General send email function
const sendEmail = async (options) => {
    const mailOptions = {
        from: `"ToxicGames" <${process.env.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
    };
    return transporter.sendMail(mailOptions);
};

// OTP email
const sendOTPEmail = async (email, otp, name = 'User') => {
    const htmlContent = `<h2>Hello ${name}!</h2><p>Your OTP is: <strong>${otp}</strong></p>`;
    const textContent = `Hello ${name}! Your OTP is: ${otp}`;
    return await sendEmail({
        to: email,
        subject: `Your OTP Code - ${otp}`,
        text: textContent,
        html: htmlContent
    });
};

module.exports = { sendEmail, sendOTPEmail };
