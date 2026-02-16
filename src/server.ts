/**
 * Main Express server for calc-server
 * Provides HTTP API for calculating trade offers
 */

import express, { Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { logger } from './utils/logger'
import { ipFilter } from './middleware/ipFilter'
import { calculateHandler } from './routes/calculate'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3100

// Middleware
app.use(express.json({ limit: '50mb' })) // Large payload support for initPayload

// CORS configuration
const corsOrigin = process.env.CORS_ORIGIN
if (corsOrigin) {
  app.use(cors({
    origin: corsOrigin,
    credentials: true,
  }))
  logger.info('[Server] CORS enabled for origin:', corsOrigin)
} else {
  app.use(cors()) // Allow all origins if not configured
  logger.info('[Server] CORS enabled for all origins')
}

// IP filtering
app.use(ipFilter)

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

// Calculate endpoint
app.post('/calculate', calculateHandler)

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
  })
})

// Start server
const server = app.listen(PORT, () => {
  logger.info(`[Server] calc-server listening on port ${PORT}`)
  logger.info(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`)
  logger.info(`[Server] Log level: ${process.env.LOG_LEVEL || 'info'}`)
})

// Graceful shutdown
const shutdown = () => {
  logger.info('[Server] Shutting down gracefully...')
  server.close(() => {
    logger.info('[Server] Server closed')
    process.exit(0)
  })
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('[Server] Forced shutdown after timeout')
    process.exit(1)
  }, 10000)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

export default app
