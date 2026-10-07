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
    usernameSha256: '14d6617a1ef3cdd9ca467979bf5024f3f46206582a1e7d8066471f10ad8bf748',
    passwordSha256: '9033d010904f493397296c5cdb334b211e12868b17c83ac1fc198ce756289284',
    /** "Keep me signed in" duration */
    rememberDays: 30,
  },

  /** Currency label shown before amounts */
  currency: 'Rs',
};
