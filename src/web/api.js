const express = require('express');
const router = express.Router();

router.get('/status', (req, res) => {
  res.json({ status: 'online', timestamp: new Date().toISOString() });
});

module.exports = router;
