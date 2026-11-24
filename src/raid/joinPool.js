const logger = require('../utils/logger');

class JoinPool {
  constructor() {
    this.pool = [];
  }

  enqueue(item) {
    this.pool.push(item);
  }

  dequeue() {
    return this.pool.shift();
  }

  size() {
    return this.pool.length;
  }
}

module.exports = new JoinPool();
