const express = require('express');
const router = express.Router();
const { getUsers, updateUserRole } = require('../controllers/userController');
const { protect, admin } = require('../middleware/auth');

router.route('/').get(protect, admin, getUsers);
router.route('/role').put(protect, admin, updateUserRole);

module.exports = router;
