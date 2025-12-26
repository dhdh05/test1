const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');

// GET: /api/games/levels/hoc-so
router.get('/levels/:gameType', gameController.getLevelsByGameType);

// POST: /api/games/submit
router.post('/submit', gameController.submitGameResult);

module.exports = router;