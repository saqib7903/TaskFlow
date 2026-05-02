const express = require('express');
const router = express.Router();
const { getAllUsers, getUser, updateUserRole, deleteUser } = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);

router.get('/', getAllUsers);
router.get('/:id', getUser);
router.put('/:id/role', restrictTo('admin'), updateUserRole);
router.delete('/:id', restrictTo('admin'), deleteUser);

module.exports = router;