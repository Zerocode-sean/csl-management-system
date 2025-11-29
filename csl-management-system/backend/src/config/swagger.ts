import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CSL Management System API',
      version: '1.0.0',
      description: 'A comprehensive certificate management system API with secure certificate issuance and verification',
      contact: {
        name: 'CSL Team',
        email: 'support@csl.com'
      },
    },
    servers: [
      {
        url: process.env['API_URL'] || 'http://localhost:5000/api/v1',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' }
                }
              }
            }
          }
        },
        Admin: {
          type: 'object',
          properties: {
            admin_id: { type: 'string', format: 'uuid' },
            username: { type: 'string' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            role: { 
              type: 'string', 
              enum: ['super_admin', 'admin', 'course_manager'] 
            },
            is_active: { type: 'boolean' },
            last_login_at: { type: 'string', format: 'date-time' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Student: {
          type: 'object',
          properties: {
            student_id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            address: { type: 'string' },
            date_of_birth: { type: 'string', format: 'date' },
            national_id: { type: 'string' },
            is_active: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Course: {
          type: 'object',
          properties: {
            course_id: { type: 'string', format: 'uuid' },
            course_code: { type: 'string', maxLength: 2 },
            course_name: { type: 'string' },
            description: { type: 'string' },
            duration_months: { type: 'integer' },
            is_active: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Certificate: {
          type: 'object',
          properties: {
            certificate_id: { type: 'string', format: 'uuid' },
            csl_number: { type: 'string', pattern: '^\\d{4}-[A-Z]{2}-\\d{4}-[A-Z0-9]{6}$' },
            student_id: { type: 'string', format: 'uuid' },
            course_id: { type: 'string', format: 'uuid' },
            issued_by: { type: 'string', format: 'uuid' },
            issued_at: { type: 'string', format: 'date-time' },
            status: { 
              type: 'string', 
              enum: ['active', 'revoked', 'suspended'] 
            },
            revoked_by: { type: 'string', format: 'uuid' },
            revoked_at: { type: 'string', format: 'date-time' },
            revocation_reason: { type: 'string' },
            student: { $ref: '#/components/schemas/Student' },
            course: { $ref: '#/components/schemas/Course' },
            issuer: { $ref: '#/components/schemas/Admin' }
          }
        },
        VerificationResult: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            valid: { type: 'boolean' },
            csl_number: { type: 'string' },
            certificate: { $ref: '#/components/schemas/Certificate' },
            message: { type: 'string' }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'], // paths to files containing OpenAPI definitions
};

export const specs = swaggerJsdoc(options);
