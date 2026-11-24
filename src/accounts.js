const logger = require('./utils/logger');

class AccountManager {
  constructor() {
    this.accounts = [];
  }

  loadAccounts() {
    logger.info('Loading accounts...');
    return this.accounts;
  }

  addAccount(account) {
    this.accounts.push(account);
  }
}

module.exports = new AccountManager();
