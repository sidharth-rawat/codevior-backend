import { StatusCodes } from 'http-status-codes';
import Joi from 'joi';
import { sendEmail } from '../services/email.service.js';
import { logger } from '../utils/logger.js';

/**
 * Controller to handle sending emails
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const sendEmailController = async (req, res, next) => {
  try {
    logger.info(
      `Email request received: ${JSON.stringify({ to: req.body.to, subject: req.body.subject })}`
    );

    // Validate the request body
    const schema = Joi.object({
      to: Joi.string().email().required().messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Recipient email address is required',
      }),
      subject: Joi.string().required().messages({
        'any.required': 'Email subject is required',
      }),
      body: Joi.string().required().messages({
        'any.required': 'Email body is required',
      }),
      // Optional fields
      cc: Joi.string().email(),
      bcc: Joi.string().email(),
      attachments: Joi.array().items(Joi.object()),
    });

    const { error, value } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      logger.warn(`Validation error in email request: ${error.message}`);
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
        })),
      });
    }

    // Send the email
    const info = await sendEmail(value);

    logger.info(`Email sent successfully to ${value.to}, ID: ${info.messageId}`);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Email sent successfully',
      data: {
        messageId: info.messageId,
        to: value.to,
      },
    });
  } catch (error) {
    logger.error(`Email sending error: ${error.message}`, { stack: error.stack });

    // For nodemailer specific errors, provide more context
    if (error.code === 'EAUTH') {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Authentication failed with email server',
        error: 'Please check your email credentials',
      });
    } else if (error.code === 'ESOCKET') {
      return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
        success: false,
        message: 'Could not connect to email server',
        error: 'Please check your email server configuration',
      });
    }

    // Pass to the global error handler
    next(error);
  }
};
