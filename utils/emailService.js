const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
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