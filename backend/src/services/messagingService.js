import logger from '../utils/logger.js';
import CommunicationLog from '../models/CommunicationLog.js';

/**
 * Service to simulate and manage multi-channel messaging (WhatsApp & SMS).
 * Built with production-ready payload interfaces compatible with Twilio and WhatsApp Cloud API.
 */
class MessagingService {
  /**
   * Dispatches a WhatsApp notification
   */
  static async sendWhatsApp({
    toPhone,
    recipientName = 'Guardian',
    recipientType = 'Parent',
    triggerEvent = 'GENERAL_CIRCULAR',
    templateName = 'school_general_alert',
    messageBody,
    sentBy = null,
    metadata = {},
  }) {
    const gatewayRef = `WA-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    logger.info(`[WhatsApp Service] Dispatched to ${toPhone} | Ref: ${gatewayRef}`);

    const log = await CommunicationLog.create({
      channel: 'WhatsApp',
      recipientType,
      recipientPhone: toPhone,
      recipientName,
      triggerEvent,
      messageTemplate: templateName,
      messageBody,
      status: 'Delivered',
      gatewayReference: gatewayRef,
      sentBy,
      metadata,
    });

    return log;
  }

  /**
   * Dispatches an SMS alert
   */
  static async sendSMS({
    toPhone,
    recipientName = 'Guardian',
    recipientType = 'Parent',
    triggerEvent = 'GENERAL_CIRCULAR',
    messageBody,
    sentBy = null,
    metadata = {},
  }) {
    const gatewayRef = `SMS-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    logger.info(`[SMS Gateway] Dispatched to ${toPhone} | Ref: ${gatewayRef}`);

    const log = await CommunicationLog.create({
      channel: 'SMS',
      recipientType,
      recipientPhone: toPhone,
      recipientName,
      triggerEvent,
      messageTemplate: 'sms_text_standard',
      messageBody,
      status: 'Delivered',
      gatewayReference: gatewayRef,
      sentBy,
      metadata,
    });

    return log;
  }
}

export default MessagingService;
