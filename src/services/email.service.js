import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';

dotenv.config();

/**
 * Create and cache nodemailer transporter
 */
const createTransporter = () => {
  try {
    logger.info('Creating email transporter');

    const transporterConfig = {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587', 10),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    };

    // Add additional configuration for specific providers
    if (transporterConfig.host.includes('gmail')) {
      logger.info('Using Gmail configuration');
      transporterConfig.tls = {
        rejectUnauthorized: false,
      };
    }

    const transporter = nodemailer.createTransport(transporterConfig);

    // Verify transporter configuration
    transporter.verify(function (error, _success) {
      if (error) {
        logger.error(`Transporter verification failed: ${error.message}`);
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
    logger.debug(`Preparing to send email to ${emailData.to}`);
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
      to: process.env.EMAIL_USER,
      subject: "You've Got a New Service Query!",
      text: plainTextBody, // plain text version
      html: htmlBody,
      cc: process.env.EMAIL_FROM, // HTML version
    };

    logger.debug('Mail options', { mailOptions });
    // Add optional fields if provided
    if (emailData.cc) mailOptions.cc = emailData.cc;
    if (emailData.bcc) mailOptions.bcc = emailData.bcc;
    if (emailData.attachments) mailOptions.attachments = emailData.attachments;

    // Send the email
    logger.debug('Sending email', { to: emailData.to, subject: emailData.subject });
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
