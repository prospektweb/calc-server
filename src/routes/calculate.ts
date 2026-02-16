/**
 * Calculate route handler
 * POST /calculate endpoint for calculating trade offers
 */

import { Request, Response } from 'express'
import { logger } from '../utils/logger'
import { transformPresetToUI } from '../lib/bitrix-to-ui-transformer'
import { calculateAllOffers } from '../services/calculationEngine'

/**
 * Calculate endpoint handler
 * 
 * Request body should contain:
 * - initPayload: Full payload with elementsStore, selectedOffers, product, preset, priceTypes, etc.
 * 
 * Response:
 * - success: boolean
 * - data: CalculationOfferResult[] (on success)
 * - error: string (on failure)
 * - timing: { startedAt, completedAt, durationMs }
 */
export async function calculateHandler(req: Request, res: Response): Promise<void> {
  const startedAt = new Date().toISOString()
  const startTime = Date.now()
  
  try {
    logger.info('[Calculate] Received calculation request')
    
    const { initPayload } = req.body
    
    // Validate initPayload
    if (!initPayload) {
      logger.warn('[Calculate] Missing initPayload in request body')
      res.status(400).json({
        success: false,
        error: 'Missing initPayload in request body',
      })
      return
    }
    
    // Extract required data from initPayload
    const {
      elementsStore,
      selectedOffers,
      product,
      preset,
      priceTypes,
    } = initPayload
    
    // Validate required fields
    if (!elementsStore) {
      logger.warn('[Calculate] Missing elementsStore in initPayload')
      res.status(400).json({
        success: false,
        error: 'Missing elementsStore in initPayload',
      })
      return
    }
    
    if (!selectedOffers || !Array.isArray(selectedOffers)) {
      logger.warn('[Calculate] Missing or invalid selectedOffers in initPayload')
      res.status(400).json({
        success: false,
        error: 'Missing or invalid selectedOffers in initPayload',
      })
      return
    }
    
    if (!priceTypes || !Array.isArray(priceTypes)) {
      logger.warn('[Calculate] Missing or invalid priceTypes in initPayload')
      res.status(400).json({
        success: false,
        error: 'Missing or invalid priceTypes in initPayload',
      })
      return
    }
    
    logger.info('[Calculate] Processing calculation:', {
      offersCount: selectedOffers.length,
      hasProduct: !!product,
      hasPreset: !!preset,
      priceTypesCount: priceTypes.length,
      elementsStoreKeys: Object.keys(elementsStore),
    })
    
    // Transform elementsStore to UI format (Details and Bindings)
    // If preset is available, use it to get top-level details
    // Otherwise, transform all details from elementsStore
    let details: any[] = []
    let bindings: any[] = []
    
    if (preset && preset.properties && elementsStore.CALC_DETAILS) {
      const transformed = transformPresetToUI(preset, elementsStore)
      details = transformed.details
      bindings = transformed.bindings
    } else {
      logger.warn('[Calculate] No preset provided, using empty details/bindings')
    }
    
    logger.info('[Calculate] Transformed data:', {
      detailsCount: details.length,
      bindingsCount: bindings.length,
    })
    
    // Calculate all offers
    const results = await calculateAllOffers(
      selectedOffers,
      product,
      preset,
      details,
      bindings,
      priceTypes,
      initPayload
    )
    
    const completedAt = new Date().toISOString()
    const durationMs = Date.now() - startTime
    
    logger.info('[Calculate] Calculation complete:', {
      resultsCount: results.length,
      durationMs,
    })
    
    res.json({
      success: true,
      data: results,
      timing: {
        startedAt,
        completedAt,
        durationMs,
      },
    })
  } catch (error) {
    const completedAt = new Date().toISOString()
    const durationMs = Date.now() - startTime
    
    logger.error('[Calculate] Calculation failed:', error)
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error : undefined,
      timing: {
        startedAt,
        completedAt,
        durationMs,
      },
    })
  }
}
