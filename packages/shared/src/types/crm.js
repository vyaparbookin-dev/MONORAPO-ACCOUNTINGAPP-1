/**
 * @typedef {'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted'} LeadStatus
 * The status of a lead in the sales pipeline.
 */

/**
 * @typedef {object} Lead
 * @property {string} [_id] - The unique identifier for the lead.
 * @property {string} name - The name of the lead.
 * @property {string} [companyId] - The company this lead belongs to.
 * @property {string} [mobileNumber] - The lead's mobile number.
 * @property {string} [email] - The lead's email address.
 * @property {string} [source] - The source from where the lead was generated (e.g., 'Website', 'Referral').
 * @property {LeadStatus} status - The current status of the lead.
 * @property {string} [notes] - Any additional notes about the lead.
 * @property {string | Date} [followUpDate] - The next date for a follow-up.
 * @property {string} [assignedTo] - The user ID of the staff member assigned to this lead.
 */

/**
 * @typedef {'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'} QuotationStatus
 * The status of a quotation.
 */

/**
 * @typedef {object} QuotationItem
 * @property {string} itemName - The name of the item.
 * @property {number} quantity - The quantity of the item.
 * @property {number} rate - The rate per unit of the item.
 * @property {number} total - The total amount for this item (quantity * rate).
 */

/**
 * @typedef {object} Quotation
 * @property {string} [_id] - The unique identifier for the quotation.
 * @property {string} quotationNumber - The unique number for the quotation.
 * @property {string} customerName - The name of the customer.
 * @property {string | Date} date - The date the quotation was created.
 * @property {string | Date} validUntil - The date until which the quotation is valid.
 * @property {QuotationItem[]} items - The list of items in the quotation.
 * @property {number} totalAmount - The total amount of the quotation.
 * @property {QuotationStatus} status - The current status of the quotation.
 */