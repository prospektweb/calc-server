/**
 * IP whitelist middleware
 * Filters requests based on ALLOWED_IPS environment variable
 */

import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'

/**
 * IP filter middleware
 * - If ALLOWED_IPS is not set or empty, allows all requests (dev mode)
 * - If ALLOWED_IPS is set, only allows requests from listed IPs
 * - Checks both req.ip and x-forwarded-for header
 */
export function ipFilter(req: Request, res: Response, next: NextFunction): void {
  const allowedIpsEnv = process.env.ALLOWED_IPS || ''
  
  // If no IPs configured, allow all (dev mode)
  if (!allowedIpsEnv.trim()) {
    logger.debug('[IP Filter] No ALLOWED_IPS configured, allowing all requests')
    next()
    return
  }
  
  // Parse allowed IPs
  const allowedIps = allowedIpsEnv.split(',').map(ip => ip.trim()).filter(ip => ip)
  
  if (allowedIps.length === 0) {
    logger.debug('[IP Filter] Empty ALLOWED_IPS, allowing all requests')
    next()
    return
  }
  
  // Get client IP from request
  let clientIp = req.ip
  
  // Check x-forwarded-for header (for proxied requests)
  const forwardedFor = req.headers['x-forwarded-for']
  if (forwardedFor) {
    if (typeof forwardedFor === 'string') {
      // Take the first IP in the chain
      clientIp = forwardedFor.split(',')[0].trim()
    } else if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
      clientIp = forwardedFor[0].trim()
    }
  }
  
  // Normalize IPv6 localhost to IPv4
  if (clientIp === '::1' || clientIp === '::ffff:127.0.0.1') {
    clientIp = '127.0.0.1'
  }
  
  logger.debug('[IP Filter] Checking IP:', {
    clientIp,
    allowedIps,
    reqIp: req.ip,
    forwardedFor: req.headers['x-forwarded-for'],
  })
  
  // Check if IP is allowed
  const isAllowed = allowedIps.some(allowedIp => {
    // Simple exact match (CIDR support could be added later)
    return clientIp === allowedIp
  })
  
  if (!isAllowed) {
    logger.warn('[IP Filter] Blocked request from unauthorized IP:', clientIp)
    res.status(403).json({
      success: false,
      error: 'Access denied',
    })
    return
  }
  
  logger.debug('[IP Filter] Allowed request from:', clientIp)
  next()
}
