import Joi from "joi";
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Get the current module URL and convert it to a file path

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
    PORT: Joi.number().default(3000).description('Application port'),
    CORS_ORIGIN: Joi.string().valid('*').required(),
   
    // Email configuration
    EMAIL_HOST: Joi.string().required().description('SMTP host'),
    EMAIL_PORT: Joi.number().required().description('SMTP port'),
    EMAIL_SECURE: Joi.boolean().default(false).description('Use TLS'),
    EMAIL_USER: Joi.string().email().required().description('SMTP username'),
    EMAIL_PASS: Joi.string().required().description('SMTP password'),
    EMAIL_FROM: Joi.string().email().required().description('Email from address'),
  })
  .unknown();


const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);


if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}


export default {
  env: envVars.NODE_ENV,
  corsOrigin: envVars.CORS_ORIGIN,
  port: envVars.PORT,
 
  // Email configuration
  email: {
    host: envVars.EMAIL_HOST,
    port: envVars.EMAIL_PORT,
    secure: envVars.EMAIL_SECURE,
    auth: {
      user: envVars.EMAIL_USER,
      pass: envVars.EMAIL_PASS,
    },
    from: envVars.EMAIL_FROM,
  },
};