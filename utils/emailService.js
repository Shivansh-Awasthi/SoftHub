const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // my email address
        pass: process.env.EMAIL_PASS // my pass
    },
});

// Example email options
const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: 'Test Email (for payment)',
    text: 'This is a test email sent regarding your Payment',
};

// Sending email
transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        return console.log('Error:', error);
    }
    console.log('Email sent:', info.response);
});


module.exports = sendEmail;