/**
 * Hand-authored OpenAPI 3 specification. Served via swagger-ui-express at /api/docs.
 * Kept compact but complete enough to exercise every endpoint from the UI.
 */
export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Citizen Report API',
    version: '1.0.0',
    description:
      'Evidence collection & case management for potential public infractions. ' +
      'The API never issues fines or determines guilt — only authorized staff review reports.',
  },
  servers: [{ url: '/api' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'object', nullable: true },
            },
          },
        },
      },
      Report: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          status: {
            type: 'string',
            enum: ['SUBMITTED', 'UNDER_REVIEW', 'INFO_REQUESTED', 'APPROVED', 'REJECTED', 'CLOSED'],
          },
          description: { type: 'string' },
          summary: { type: 'string', nullable: true },
          latitude: { type: 'number', nullable: true },
          longitude: { type: 'number', nullable: true },
          address: { type: 'string', nullable: true },
          anonymous: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/health': {
      get: { tags: ['System'], summary: 'Health check', security: [], responses: { 200: { description: 'OK' } } },
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new citizen account',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 10 },
                  displayName: { type: 'string' },
                  captchaToken: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Created' }, 409: { description: 'Email exists' } },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: { email: { type: 'string' }, password: { type: 'string' } },
              },
            },
          },
        },
        responses: { 200: { description: 'Access token + refresh cookie' }, 401: { description: 'Invalid' } },
      },
    },
    '/auth/refresh': { post: { tags: ['Auth'], summary: 'Rotate refresh token', security: [], responses: { 200: { description: 'OK' } } } },
    '/auth/logout': { post: { tags: ['Auth'], summary: 'Logout', security: [], responses: { 200: { description: 'OK' } } } },
    '/auth/verify-email': { post: { tags: ['Auth'], summary: 'Verify email', security: [], responses: { 200: { description: 'OK' } } } },
    '/auth/forgot-password': { post: { tags: ['Auth'], summary: 'Request password reset', security: [], responses: { 200: { description: 'OK' } } } },
    '/auth/reset-password': { post: { tags: ['Auth'], summary: 'Reset password', security: [], responses: { 200: { description: 'OK' } } } },

    '/reports/categories': { get: { tags: ['Reports'], summary: 'List categories', security: [], responses: { 200: { description: 'OK' } } } },
    '/reports': {
      post: {
        tags: ['Reports'],
        summary: 'Submit a report (anonymous or authenticated)',
        security: [],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['categorySlug', 'description', 'consentGiven', 'media'],
                properties: {
                  categorySlug: { type: 'string' },
                  description: { type: 'string' },
                  latitude: { type: 'number' },
                  longitude: { type: 'number' },
                  address: { type: 'string' },
                  incidentAt: { type: 'string', format: 'date-time' },
                  anonymous: { type: 'boolean' },
                  contact: { type: 'string' },
                  consentGiven: { type: 'boolean' },
                  media: { type: 'array', items: { type: 'string', format: 'binary' } },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Submitted' }, 400: { description: 'Validation error' } },
      },
    },
    '/reports/mine': { get: { tags: ['Reports'], summary: "List the caller's reports", responses: { 200: { description: 'OK' } } } },
    '/reports/{id}': {
      get: {
        tags: ['Reports'],
        summary: 'Get a report',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'OK' }, 403: { description: 'Forbidden' }, 404: { description: 'Not found' } },
      },
    },

    '/users/me': { get: { tags: ['Users'], summary: 'Current profile', responses: { 200: { description: 'OK' } } }, delete: { tags: ['Users'], summary: 'GDPR erasure', responses: { 200: { description: 'OK' } } } },
    '/users/me/export': { get: { tags: ['Users'], summary: 'GDPR data export', responses: { 200: { description: 'OK' } } } },

    '/admin/reports': { get: { tags: ['Admin'], summary: 'List/filter all reports', responses: { 200: { description: 'OK' } } } },
    '/admin/reports/{id}': { get: { tags: ['Admin'], summary: 'View evidence (audited)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' } } } },
    '/admin/reports/{id}/status': {
      patch: {
        tags: ['Admin'],
        summary: 'Change report status (approve/reject/info/close)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['UNDER_REVIEW', 'INFO_REQUESTED', 'APPROVED', 'REJECTED', 'CLOSED'] },
                  note: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'OK' }, 400: { description: 'Illegal transition' } },
      },
    },
    '/admin/audit': { get: { tags: ['Admin'], summary: 'Read audit log', responses: { 200: { description: 'OK' } } } },
    '/admin/stats': { get: { tags: ['Admin'], summary: 'Report stats', responses: { 200: { description: 'OK' } } } },
    '/admin/users/{userId}/role': { patch: { tags: ['Admin'], summary: 'Change a user role (ADMIN only)', parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' } } } },

    '/ai/analyze': { post: { tags: ['AI'], summary: 'Run plate OCR + tamper detection (staff)', responses: { 200: { description: 'OK' } } } },
  },
} as const;
