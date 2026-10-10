/**
 * ─────────────────────────────────────────────────────────────────────
 *  QGE RATE PORTAL — SETTINGS
 *  Qaiser Group of Electronics
 * ─────────────────────────────────────────────────────────────────────
 */
export const CONFIG = {
  companyName: 'Qaiser Group of Electronics',
  portalName: 'Salesman Rate Portal',

  /**
   * Excel file the portal reads (put it next to index.html in your GitHub repo).
   * The first file that exists is used. Normally just upload "rates.xlsx".
   */
  ratesFiles: ['rates.xlsx', 'rates.xls', 'rates.csv'],

  /**
   * Companies whose cards show the 3rd "FIX RATE" box.
   * All other companies show only CASH + INSTALLMENT.
   */
  fixRateCompanies: ['HAIER'],

  /**
   * Login — saved as SHA-256 hashes (never plain text).
   * Username is checked in CAPITAL letters, password exactly as typed.
   * To change: generate SHA-256 of the new values (any online "SHA-256 generator")
   * and paste them below, then rebuild.
   */
  auth: {
    usernameSha256: 'f785a45de055b37ca271f265d5d7d248a29c0984c4bb013c0271ebf492750ed3',
    passwordSha256: 'e0bc60c82713f64ef8a57c0c40d02ce24fd0141d5cc3086259c19b1e62a62bea',
    /** "Keep me signed in" duration */
    rememberDays: 1/48,
  },

  /** Currency label shown before amounts */
  currency: 'Rs',
};
