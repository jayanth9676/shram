const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

router.post('/users/register', userController.register);
router.post('/users/login', userController.login);
router.get('/users/me', auth, userController.getUser);
router.post('/users/scores', auth, userController.saveScore);
router.get('/leaderboard', auth, userController.getLeaderboard);

module.exports = router;