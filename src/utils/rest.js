const logger = require('./logger');

async function request(url, options = {}) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    logger.error(`REST request error on ${url}:`, error.message);
    throw error;
  }
}

module.exports = { request };
