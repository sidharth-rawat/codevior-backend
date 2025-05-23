import nodemailer from 'nodemailer';

import { logger } from '../utils/logger.js';
import config from '../config/index.js';

const { email } = config;

/**
 * Create and cache nodemailer transporter
 */
const createTransporter = () => {
  try {
    logger.info('Creating email transporter', email, email.auth);
    console.log(email.auth);

    const transporterConfig = {
      host: email.host || 'smtp.gmail.com',
      port: parseInt(email.port || '587', 10),
      secure: email.secure === 'true',
      auth: {
        user: email.auth.user,
        pass: email.auth.pass,
      },
      // tls: {
      //   // Do not fail on invalid certs
      //   rejectUnauthorized: false,
      //   // Use TLS 1.2
      //   minVersion: 'TLSv1.2',
      // },
    };

    // Add additional configuration for specific providers
    if (transporterConfig.host.includes('gmail')) {
      logger.info('Using Gmail configuration');
      // Gmail specific settings
      transporterConfig.secure = false; // Use STARTTLS
      transporterConfig.port = 587; // Gmail's STARTTLS port
    }

    const transporter = nodemailer.createTransport(transporterConfig);

    // Verify transporter configuration
    transporter.verify(function (error, _success) {
      if (error) {
        logger.error(`Transporter verification failed: ${error.message}`);
        logger.error('Please check your email configuration settings:');
        logger.error(`Host: ${transporterConfig.host}`);
        logger.error(`Port: ${transporterConfig.port}`);
        logger.error(`Secure: ${transporterConfig.secure}`);
      } else {
        logger.info('Email transporter is ready to send messages');
      }
    });

    return transporter;
  } catch (error) {
    logger.error(`Failed to create email transporter: ${error.message}`);
    throw new Error(`Email configuration error: ${error.message}`);
  }
};

// Create transporter once
const transporter = createTransporter();

/**
 * Send an email using nodemailer
 * @param {Object} emailData - Email data containing to, subject, body, and optional cc, bcc, attachments
 * @returns {Promise} - Promise representing the email sending operation
 */
export const sendEmail = async emailData => {
  try {
    console.log(JSON.stringify(emailData));

    logger.debug(`Preparing to send email to ${emailData.email}, ${emailData}`);
    const htmlBody = `
    <p><strong>New Service Inquiry Received</strong></p>
    <p>
      Name: ${emailData.name}<br>
      Email: ${emailData.email}<br>
      Phone: ${emailData.phone}<br>
      Service: ${emailData.service}<br>
      Message: ${emailData.message}
    </p>
  `;

    const plainTextBody = `
  New Service Inquiry Received
  
  Name: ${emailData.name}
  Email: ${emailData.email}
  Phone: ${emailData.phone}
  Service: ${emailData.service}
  Message: ${emailData.message}
  `;

    const mailOptions = {
      from: emailData.email,
      to: email.user,
      subject: "You've Got a New Service Query!",
      text: plainTextBody, // plain text version
      html: htmlBody,
      cc: email.from, // HTML version
    };

    logger.debug('Mail options', { mailOptions });
    // Add optional fields if provided
    if (emailData.cc) mailOptions.cc = emailData.cc;
    if (emailData.bcc) mailOptions.bcc = emailData.bcc;
    if (emailData.attachments) mailOptions.attachments = emailData.attachments;

    // Send the email
    logger.debug('Sending email', { to: emailData.email, subject: emailData.subject });
    const info = await transporter.sendMail(mailOptions);

    logger.info(`Email sent successfully: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`Email sending error: ${error.message}`, { stack: error.stack });
    throw error;
  }
};

/**
 * Send a templated email
 * @param {string} to - Recipient email
 * @param {string} templateName - Name of the template to use
 * @param {Object} data - Data to populate the template with
 * @returns {Promise} - Promise representing the email sending operation
 */
export const sendTemplatedEmail = async (to, templateName, data) => {
  try {
    // This is a placeholder for template functionality
    // In a real implementation, you would load a template and render it with the data
    const subject = `Template: ${templateName}`;
    const body = `This is a templated email for ${data.name || 'user'}`;

    return await sendEmail({
      to,
      subject,
      body,
    });
  } catch (error) {
    logger.error(`Failed to send templated email: ${error.message}`);
    throw error;
  }
};
