import twilio from 'twilio';
import { config } from '@/config/config';

/**
 * WhatsApp Service
 *
 * Sends WhatsApp messages via Twilio WhatsApp Business API.
 * Pro plan only.
 */

let _twilioClient: ReturnType<typeof twilio> | null = null;
function getTwilioClient() {
    if (!_twilioClient) _twilioClient = twilio(config.whatsapp.accountSid, config.whatsapp.authToken);
    return _twilioClient;
}

export class WhatsAppService {
    async sendReminderWhatsApp(params: {
        to: string; // e.g., "whatsapp:+1234567890"
        clientName: string;
        invoiceNumber: string;
        amount: string;
        currency: string;
        paymentLink: string;
        businessName: string;
    }) {
        const { to, clientName, invoiceNumber, amount, currency, paymentLink, businessName } = params;

        const body = `Hi ${clientName}, this is a friendly reminder that invoice #${invoiceNumber} for ${currency} ${amount} is due. Please pay here: ${paymentLink} — ${businessName}`;

        const message = await getTwilioClient().messages.create({
            from: config.whatsapp.from,
            to: `whatsapp:${to}`,
            body,
        });

        return { sid: message.sid, status: message.status };
    }
}

export const whatsappService = new WhatsAppService();
