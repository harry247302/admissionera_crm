// Communication service abstraction — wire to third-party APIs when available
export const communicationService = {
  async sendCall(_leadId, _phone) {
    return { success: false, message: 'Call integration not configured' };
  },
  async sendWhatsApp(_leadId, _phone, _message) {
    return { success: false, message: 'WhatsApp integration not configured' };
  },
  async sendEmail(_leadId, _email, _subject, _body) {
    return { success: false, message: 'Email integration not configured' };
  },
  async sendSMS(_leadId, _phone, _message) {
    return { success: false, message: 'SMS integration not configured' };
  },
};
