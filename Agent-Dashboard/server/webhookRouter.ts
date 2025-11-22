import { Router, type Request, type Response } from 'express';
import express from 'express';
import { handleLivekitWebhook } from './webhookHandler';

export const webhookRouter = Router();

// Note: Raw body parsing is handled at app level in index.ts
// This ensures the raw body is available before any JSON parsing

webhookRouter.post('/livekit', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization || '';
    // Debug: Log body type and first few bytes
    console.log('[Webhook Debug] Body type:', typeof req.body, 'isBuffer:', req.body instanceof Buffer, 'isString:', typeof req.body === 'string');
    if (req.body instanceof Buffer) {
      console.log('[Webhook Debug] Buffer length:', req.body.length, 'first 100 chars:', req.body.toString('utf8').substring(0, 100));
    }
    // Use raw body buffer and convert to string for signature verification
    // LiveKit signs the original body, so we must use the raw buffer
    const body = req.body instanceof Buffer ? req.body.toString('utf8') : (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
    
    await handleLivekitWebhook(body, authHeader);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('[Webhook Router] Error processing webhook:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});
