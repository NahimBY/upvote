import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const swaggerDefinition: swaggerJsdoc.OAS3Definition = {
  openapi: '3.0.3',
  info: {
    title: 'UpVote API',
    version: '1.0.0',
    description: 'API de la plataforma de votaciones UpVote. Gestión de elecciones, votos y usuarios con autenticación Keycloak.',
    contact: {
      name: 'UpVote Team'
    }
  },
  servers: [
    {
      url: 'http://localhost:4000',
      description: 'Servidor de desarrollo'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT obtenido del endpoint /api/auth/login'
      }
    },
    schemas: {
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data: {}
        }
      },
      User: {
        type: 'object',
        properties: {
          keycloakId: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          username: { type: 'string' },
          role: { type: 'string', enum: ['admin', 'organizator', 'voter'] },
          isActive: { type: 'boolean' },
          location: {
            type: 'object',
            properties: {
              country: { type: 'string' },
              state: { type: 'string' },
              city: { type: 'string' },
              district: { type: 'string' }
            }
          },
          eligibilityTags: { type: 'array', items: { type: 'string' } },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Election: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          type: { type: 'string', enum: ['single_choice', 'multiple_choice', 'yes_no'] },
          status: { type: 'string', enum: ['draft', 'published', 'open', 'closed', 'archived'] },
          options: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                label: { type: 'string' },
                description: { type: 'string' }
              }
            }
          },
          isLocationRestricted: { type: 'boolean' },
          visibilityRules: {
            type: 'object',
            properties: {
              locations: {
                type: 'object',
                properties: {
                  country: { type: 'array', items: { type: 'string' } },
                  state: { type: 'array', items: { type: 'string' } },
                  city: { type: 'array', items: { type: 'string' } },
                  district: { type: 'array', items: { type: 'string' } }
                }
              },
              requiredTags: { type: 'array', items: { type: 'string' } }
            }
          },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          createdByKeycloakId: { type: 'string' },
          allowResultsBeforeClose: { type: 'boolean' },
          maxSelections: { type: 'integer' },
          maxVotes: { type: 'integer', nullable: true },
          currentVotes: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Vote: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          electionId: { type: 'string' },
          voterKeycloakId: { type: 'string' },
          selectedOptionIds: { type: 'array', items: { type: 'string' } },
          submittedAt: { type: 'string', format: 'date-time' },
          receiptCode: { type: 'string' }
        }
      },
      TokenResponse: {
        type: 'object',
        properties: {
          accessToken: { type: 'string' },
          refreshToken: { type: 'string' },
          expiresIn: { type: 'integer' },
          tokenType: { type: 'string', example: 'Bearer' }
        }
      }
    }
  },
  tags: [
    { name: 'Health', description: 'Estado del servidor' },
    { name: 'Auth', description: 'Autenticación y sesión (Keycloak)' },
    { name: 'Users', description: 'Perfil de usuario' },
    { name: 'Voter', description: 'Endpoints para votantes' },
    { name: 'Votes', description: 'Emisión y verificación de votos' },
    { name: 'Organizator', description: 'Gestión de salas de votación (organizadores)' },
    { name: 'Organizator Stats', description: 'Estadísticas para organizadores' },
    { name: 'Admin', description: 'Panel de administración (super admin)' }
  ],
  paths: {
    // ───── Health ─────
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        description: 'Verifica que el servidor esté funcionando.',
        responses: {
          '200': { description: 'Servidor activo', content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', example: 'ok' } } } } } }
        }
      }
    },

    // ───── Auth ─────
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Iniciar sesión',
        description: 'Autentica al usuario con email/password vía Keycloak y devuelve tokens JWT.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'usuario@correo.com' },
                  password: { type: 'string', example: 'miPassword123' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Login exitoso', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/ApiResponse' }, { properties: { data: { $ref: '#/components/schemas/TokenResponse' } } }] } } } },
          '400': { description: 'Credenciales inválidas' },
          '429': { description: 'Demasiados intentos (rate limit: 10/15min)' }
        }
      }
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Registrar nuevo votante',
        description: 'Crea un nuevo usuario en Keycloak y MongoDB con rol voter. Devuelve tokens para auto-login.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'username', 'firstName', 'lastName', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'nuevo@correo.com' },
                  username: { type: 'string', minLength: 3, example: 'nuevousuario' },
                  firstName: { type: 'string', example: 'Juan' },
                  lastName: { type: 'string', example: 'Pérez' },
                  password: { type: 'string', minLength: 6, example: 'password123' }
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'Registro exitoso', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/ApiResponse' }, { properties: { data: { $ref: '#/components/schemas/TokenResponse' } } }] } } } },
          '409': { description: 'Email o username ya existe' },
          '429': { description: 'Rate limit' }
        }
      }
    },
    '/api/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Renovar token',
        description: 'Renueva el access token usando el refresh token.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Token renovado', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/ApiResponse' }, { properties: { data: { $ref: '#/components/schemas/TokenResponse' } } }] } } } },
          '401': { description: 'Refresh token inválido o expirado' }
        }
      }
    },
    '/api/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Cerrar sesión',
        description: 'Invalida el refresh token en Keycloak.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Logout exitoso' }
        }
      }
    },
    '/api/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Solicitar recuperación de contraseña',
        description: 'Envía un correo con enlace de recuperación (válido 30 minutos).',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Correo enviado (siempre responde OK por seguridad)' },
          '429': { description: 'Rate limit' }
        }
      }
    },
    '/api/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Restablecer contraseña',
        description: 'Restablece la contraseña usando el token enviado por correo.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'password'],
                properties: {
                  token: { type: 'string', description: 'Token JWT de recuperación' },
                  password: { type: 'string', minLength: 6 }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Contraseña restablecida' },
          '400': { description: 'Token inválido o expirado' }
        }
      }
    },
    '/api/auth/check': {
      get: {
        tags: ['Auth'],
        summary: 'Verificar sesión',
        description: 'Verifica que el token JWT sea válido.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Sesión válida' },
          '401': { description: 'Token inválido' }
        }
      }
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Info del usuario autenticado',
        description: 'Devuelve los claims del JWT (sub, email, roles, etc.).',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Datos del usuario',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      properties: {
                        data: {
                          type: 'object',
                          properties: {
                            sub: { type: 'string' },
                            email: { type: 'string' },
                            username: { type: 'string' },
                            firstName: { type: 'string' },
                            lastName: { type: 'string' },
                            roles: { type: 'array', items: { type: 'string' } }
                          }
                        }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      }
    },

    // ───── Users ─────
    '/api/me': {
      get: {
        tags: ['Users'],
        summary: 'Perfil del usuario',
        description: 'Obtiene o crea el perfil del usuario en MongoDB a partir del JWT.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Perfil obtenido', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/ApiResponse' }, { properties: { data: { $ref: '#/components/schemas/User' } } }] } } } }
        }
      }
    },

    // ───── Voter ─────
    '/api/elections/public': {
      get: {
        tags: ['Voter'],
        summary: 'Elecciones públicas',
        description: 'Obtiene las elecciones abiertas. No requiere autenticación.',
        responses: {
          '200': { description: 'Lista de elecciones abiertas', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/ApiResponse' }, { properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Election' } } } }] } } } }
        }
      }
    },
    '/api/elections': {
      get: {
        tags: ['Voter'],
        summary: 'Elecciones elegibles',
        description: 'Obtiene las elecciones para las que el votante es elegible según su ubicación y tags.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Lista de elecciones elegibles' }
        }
      }
    },
    '/api/elections/{id}': {
      get: {
        tags: ['Voter'],
        summary: 'Detalle de elección (votante)',
        description: 'Obtiene el detalle de una elección para el votante.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'ID de la elección' }],
        responses: {
          '200': { description: 'Detalle de la elección', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/ApiResponse' }, { properties: { data: { $ref: '#/components/schemas/Election' } } }] } } } },
          '404': { description: 'Elección no encontrada' }
        }
      }
    },

    // ───── Votes ─────
    '/api/votes': {
      post: {
        tags: ['Votes'],
        summary: 'Emitir voto',
        description: 'Emite un voto en una elección abierta. Rate limit: 5 votos por 10 minutos.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['electionId', 'selectedOptionIds'],
                properties: {
                  electionId: { type: 'string', description: 'ID de la elección' },
                  selectedOptionIds: { type: 'array', items: { type: 'string' }, minItems: 1, description: 'IDs de las opciones seleccionadas' }
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'Voto emitido', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/ApiResponse' }, { properties: { data: { $ref: '#/components/schemas/Vote' } } }] } } } },
          '400': { description: 'Elección no abierta o ya votó' },
          '429': { description: 'Rate limit' }
        }
      }
    },
    '/api/votes/my': {
      get: {
        tags: ['Votes'],
        summary: 'Mis votos',
        description: 'Obtiene el historial de votos del usuario autenticado.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Lista de votos', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/ApiResponse' }, { properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Vote' } } } }] } } } }
        }
      }
    },
    '/api/votes/receipt/{receiptCode}': {
      get: {
        tags: ['Votes'],
        summary: 'Verificar recibo de voto',
        description: 'Verifica la autenticidad de un recibo de voto.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'receiptCode', in: 'path', required: true, schema: { type: 'string' }, description: 'Código del recibo' }],
        responses: {
          '200': { description: 'Recibo verificado' },
          '404': { description: 'Recibo no encontrado' }
        }
      }
    },
    '/api/elections/{electionId}/results': {
      get: {
        tags: ['Votes'],
        summary: 'Resultados de elección',
        description: 'Obtiene los resultados de una elección (si está permitido antes de cerrar o ya cerrada).',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'electionId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Resultados de la elección' }
        }
      }
    },

    // ───── Organizator ─────
    '/api/organizator/elections': {
      get: {
        tags: ['Organizator'],
        summary: 'Listar mis elecciones',
        description: 'Obtiene todas las elecciones creadas por el organizador.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Lista de elecciones', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/ApiResponse' }, { properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Election' } } } }] } } } }
        }
      },
      post: {
        tags: ['Organizator'],
        summary: 'Crear elección',
        description: 'Crea una nueva sala de votación en estado borrador. Para tipo yes_no las opciones se generan automáticamente.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'type', 'startDate', 'endDate'],
                properties: {
                  title: { type: 'string', minLength: 3, example: 'Elección de presidente' },
                  description: { type: 'string', example: 'Selecciona al próximo presidente' },
                  type: { type: 'string', enum: ['single_choice', 'multiple_choice', 'yes_no'] },
                  options: {
                    type: 'array',
                    description: 'Requerido para single_choice y multiple_choice. Ignorado para yes_no.',
                    items: {
                      type: 'object',
                      required: ['label'],
                      properties: {
                        label: { type: 'string', example: 'Candidato A' },
                        description: { type: 'string', example: 'Descripción del candidato' }
                      }
                    }
                  },
                  startDate: { type: 'string', format: 'date-time', example: '2026-05-01T09:00:00Z' },
                  endDate: { type: 'string', format: 'date-time', example: '2026-05-01T18:00:00Z' },
                  allowResultsBeforeClose: { type: 'boolean', default: false },
                  maxSelections: { type: 'integer', description: 'Solo para multiple_choice', example: 2 },
                  maxVotes: { type: 'integer', nullable: true, description: 'Límite de votos totales (null = sin límite)' },
                  isLocationRestricted: { type: 'boolean', default: false },
                  visibilityRules: {
                    type: 'object',
                    properties: {
                      locations: {
                        type: 'object',
                        properties: {
                          country: { type: 'array', items: { type: 'string' } },
                          state: { type: 'array', items: { type: 'string' } },
                          city: { type: 'array', items: { type: 'string' } },
                          district: { type: 'array', items: { type: 'string' } }
                        }
                      },
                      requiredTags: { type: 'array', items: { type: 'string' } }
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'Elección creada', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/ApiResponse' }, { properties: { data: { $ref: '#/components/schemas/Election' } } }] } } } },
          '400': { description: 'Datos inválidos' }
        }
      }
    },
    '/api/organizator/elections/{id}': {
      get: {
        tags: ['Organizator'],
        summary: 'Detalle de elección',
        description: 'Obtiene el detalle completo de una elección del organizador.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Elección encontrada' },
          '404': { description: 'No encontrada' }
        }
      },
      put: {
        tags: ['Organizator'],
        summary: 'Actualizar elección',
        description: 'Actualiza los datos de una elección (solo en estado draft).',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  options: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, label: { type: 'string' }, description: { type: 'string' } } } },
                  startDate: { type: 'string', format: 'date-time' },
                  endDate: { type: 'string', format: 'date-time' },
                  allowResultsBeforeClose: { type: 'boolean' },
                  maxSelections: { type: 'integer' },
                  maxVotes: { type: 'integer', nullable: true },
                  isLocationRestricted: { type: 'boolean' },
                  visibilityRules: { type: 'object' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Elección actualizada' },
          '404': { description: 'No encontrada' }
        }
      },
      delete: {
        tags: ['Organizator'],
        summary: 'Eliminar elección',
        description: 'Elimina una elección permanentemente.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Elección eliminada' },
          '404': { description: 'No encontrada' }
        }
      }
    },
    '/api/organizator/elections/{id}/status': {
      patch: {
        tags: ['Organizator'],
        summary: 'Cambiar estado de elección',
        description: 'Cambia el estado de una elección (published, open, closed, archived).',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['published', 'open', 'closed', 'archived'] }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Estado actualizado' }
        }
      }
    },
    '/api/organizator/elections/{id}/participation': {
      get: {
        tags: ['Organizator Stats'],
        summary: 'Participación de una elección',
        description: 'Obtiene estadísticas de participación (votos emitidos vs máximo) de una elección propia.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'Datos de participación',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      properties: {
                        data: {
                          type: 'object',
                          properties: {
                            totalVotes: { type: 'integer' },
                            maxVotes: { type: 'integer', nullable: true },
                            percentage: { type: 'number' }
                          }
                        }
                      }
                    }
                  ]
                }
              }
            }
          },
          '403': { description: 'No es propietario de la elección' }
        }
      }
    },
    '/api/organizator/elections/{id}/distribution': {
      get: {
        tags: ['Organizator Stats'],
        summary: 'Distribución de votos',
        description: 'Obtiene la distribución de votos por opción de una elección propia.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'Distribución de votos',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      properties: {
                        data: {
                          type: 'object',
                          properties: {
                            electionTitle: { type: 'string' },
                            totalVotes: { type: 'integer' },
                            options: {
                              type: 'array',
                              items: {
                                type: 'object',
                                properties: {
                                  id: { type: 'string' },
                                  label: { type: 'string' },
                                  votes: { type: 'integer' },
                                  percentage: { type: 'number' }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  ]
                }
              }
            }
          },
          '403': { description: 'No es propietario de la elección' }
        }
      }
    },

    // ───── Organizator Stats ─────
    '/api/organizator/dashboard': {
      get: {
        tags: ['Organizator Stats'],
        summary: 'Dashboard del organizador',
        description: 'Estadísticas generales: votos totales, salas activas, actividad reciente.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Stats del dashboard',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      properties: {
                        data: {
                          type: 'object',
                          properties: {
                            stats: {
                              type: 'object',
                              properties: {
                                totalVotes: { type: 'integer' },
                                activeRooms: { type: 'integer' }
                              }
                            },
                            recentActivity: {
                              type: 'array',
                              items: {
                                type: 'object',
                                properties: {
                                  user: { type: 'string' },
                                  action: { type: 'string' },
                                  room: { type: 'string' },
                                  time: { type: 'string' }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      }
    },
    '/api/organizator/stats/overview': {
      get: {
        tags: ['Organizator Stats'],
        summary: 'Resumen estadístico',
        description: 'Total de salas, participación promedio, distribución por estado.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Resumen',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      properties: {
                        data: {
                          type: 'object',
                          properties: {
                            totalElections: { type: 'integer' },
                            draftElections: { type: 'integer' },
                            openElections: { type: 'integer' },
                            closedElections: { type: 'integer' },
                            averageParticipation: { type: 'number' }
                          }
                        }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      }
    },
    '/api/organizator/stats/votes-timeline': {
      get: {
        tags: ['Organizator Stats'],
        summary: 'Tendencia de votos',
        description: 'Cantidad de votos por día en los últimos N días.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'days', in: 'query', schema: { type: 'integer', default: 7, minimum: 1, maximum: 90 }, description: 'Días hacia atrás (máx 90)' }
        ],
        responses: {
          '200': {
            description: 'Timeline de votos',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      properties: {
                        data: {
                          type: 'object',
                          properties: {
                            days: { type: 'integer' },
                            timeline: {
                              type: 'array',
                              items: {
                                type: 'object',
                                properties: {
                                  date: { type: 'string', format: 'date' },
                                  count: { type: 'integer' }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      }
    },
    '/api/organizator/elections/upcoming': {
      get: {
        tags: ['Organizator Stats'],
        summary: 'Próximas elecciones',
        description: 'Elecciones publicadas o en borrador que aún no han comenzado.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Lista de próximas elecciones' }
        }
      }
    },

    // ───── Admin ─────
    '/api/admin/stats': {
      get: {
        tags: ['Admin'],
        summary: 'Estadísticas de usuarios',
        description: 'Conteos por rol, usuarios activos/inactivos, últimos 5 registros.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Stats de admin',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      properties: {
                        data: {
                          type: 'object',
                          properties: {
                            totalUsers: { type: 'integer' },
                            admins: { type: 'integer' },
                            organizators: { type: 'integer' },
                            voters: { type: 'integer' },
                            activeUsers: { type: 'integer' },
                            inactiveUsers: { type: 'integer' },
                            recentUsers: { type: 'array', items: { $ref: '#/components/schemas/User' } }
                          }
                        }
                      }
                    }
                  ]
                }
              }
            }
          },
          '403': { description: 'No tiene rol admin' }
        }
      }
    },
    '/api/admin/users': {
      get: {
        tags: ['Admin'],
        summary: 'Listar usuarios',
        description: 'Lista paginada de usuarios con filtros por rol y búsqueda.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'role', in: 'query', schema: { type: 'string', enum: ['admin', 'organizator', 'voter'] }, description: 'Filtrar por rol' },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Buscar por nombre, email o username' }
        ],
        responses: {
          '200': {
            description: 'Lista de usuarios',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      properties: {
                        data: {
                          type: 'object',
                          properties: {
                            users: { type: 'array', items: { $ref: '#/components/schemas/User' } },
                            total: { type: 'integer' },
                            page: { type: 'integer' },
                            limit: { type: 'integer' },
                            totalPages: { type: 'integer' }
                          }
                        }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Admin'],
        summary: 'Crear usuario (admin/organizador)',
        description: 'Crea un nuevo usuario en Keycloak y MongoDB con rol admin u organizador. El email se usa como username.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'firstName', 'lastName', 'password', 'role'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'organizador@correo.com' },
                  firstName: { type: 'string', example: 'María' },
                  lastName: { type: 'string', example: 'García' },
                  password: { type: 'string', minLength: 6, example: 'password123' },
                  role: { type: 'string', enum: ['admin', 'organizator'], description: 'Solo admin u organizador (los votantes se registran solos)' }
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'Usuario creado', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/ApiResponse' }, { properties: { data: { $ref: '#/components/schemas/User' } } }] } } } },
          '409': { description: 'Email o username ya existe' },
          '403': { description: 'No tiene rol admin' }
        }
      }
    },
    '/api/admin/users/{keycloakId}/role': {
      patch: {
        tags: ['Admin'],
        summary: 'Cambiar rol de usuario',
        description: 'Cambia el rol de un usuario (solo entre admin y organizador). No se puede cambiar el rol de votantes ni el propio.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'keycloakId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['role'],
                properties: {
                  role: { type: 'string', enum: ['admin', 'organizator'] }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Rol actualizado' },
          '400': { description: 'No se puede cambiar rol propio o de votante' },
          '404': { description: 'Usuario no encontrado' }
        }
      }
    },
    '/api/admin/users/{keycloakId}/active': {
      patch: {
        tags: ['Admin'],
        summary: 'Activar/desactivar usuario',
        description: 'Alterna el estado activo/inactivo de un usuario. No se puede desactivar a uno mismo.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'keycloakId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Estado cambiado' },
          '400': { description: 'No se puede desactivar la propia cuenta' }
        }
      }
    }
  }
};

const swaggerSpec = swaggerDefinition;

export function setupSwagger(app: Express): void {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'UpVote API Docs'
  }));

  // Serve raw JSON spec
  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}
