const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  getTasks, getTask, createTask, updateTask, deleteTask, addComment, getMyTasks,
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/my', getMyTasks);
router.get('/', getTasks);
router.post('/', [
  body('title').trim().notEmpty().withMessage('Task title is required'),
  body('project').notEmpty().withMessage('Project is required'),
], createTask);

router.get('/:id', getTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
router.post('/:id/comments', addComment);

module.exports = router;