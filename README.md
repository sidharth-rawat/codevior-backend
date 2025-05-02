# Codevior Backend

## Email API Service

This backend service provides an API endpoint for sending emails with enhanced security, logging, and performance features.

### Features

- Email sending API with detailed error handling
- Request validation and error reporting
- Comprehensive logging (console and file-based) with automatic flushing
- Security headers via Helmet
- Rate limiting to prevent abuse
- Response compression for performance
- Health check endpoint
- ESLint and Prettier for code quality and consistency
- Graceful shutdown with log flushing

### Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Email Configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_FROM=your-email@gmail.com
   ```
   
   For Gmail, you'll need to generate an "App Password". See [Google Account Help](https://support.google.com/accounts/answer/185833) for details.

4. Start the server:
   ```
   npm start
   ```

### Development

#### Running in Development Mode

Run the server with automatic reloading:
```
npm run dev
```

#### Code Quality

This project uses ESLint and Prettier for code quality and formatting:

- **Lint code**: `npm run lint`
- **Fix linting issues**: `npm run lint:fix`
- **Format code**: `npm run format`

Pre-commit hooks (using Husky and lint-staged) automatically run linting and formatting on staged files before each commit.

### Logging System

The application uses Winston for logging with the following features:

- **Automatic Log Flushing**: Logs are automatically flushed to disk on server shutdown (SIGTERM/SIGINT)
- **Manual Log Flushing**: A protected endpoint is available to manually flush logs when needed
- **Log Levels**: Different log levels based on environment (debug in development, info in production)
- **File Storage**: Logs are stored in the `logs` directory:
  - `combined.log`: All logs
  - `error.log`: Error logs only

#### Manual Log Flush Endpoint

```
POST /api/logs/flush
```

This endpoint is restricted to localhost calls only.

### API Usage

#### Send Email

**Endpoint:** `POST /api/send-email`

**Request Body:**
```json
{
  "to": "recipient@example.com",
  "subject": "Your Subject",
  "body": "Your email content here",
  "cc": "optional-cc@example.com",
  "bcc": "optional-bcc@example.com",
  "attachments": [
    {
      "filename": "attachment.txt",
      "content": "Hello World!"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email sent successfully",
  "data": {
    "messageId": "<generated-message-id>",
    "to": "recipient@example.com"
  }
}
```

### Error Handling

The API provides detailed error responses:

- **Validation Errors**: 400 Bad Request with details of validation failures
- **Authentication Errors**: 401 Unauthorized for email server auth issues
- **Connection Errors**: 503 Service Unavailable for email server connection issues
- **Generic Errors**: 500 Internal Server Error for other failures

### Health Check

**Endpoint:** `GET /health`

Use this endpoint to verify the service is running.