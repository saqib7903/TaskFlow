const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  getProjects, getProject, createProject, updateProject,
  deleteProject, addMember, removeMember, updateMemberRole,
} = require('../controllers/projectController');
const { protect, isProjectAdmin, restrictTo } = require('../middleware/auth');

router.use(protect);

router.get('/', getProjects);
router.post('/', [
  body('name').trim().notEmpty().withMessage('Project name is required'),
], createProject);

router.get('/:id', getProject);
router.put('/:id', isProjectAdmin, updateProject);
router.delete('/:id', isProjectAdmin, deleteProject);

// Team management
router.post('/:id/members', isProjectAdmin, addMember);
router.delete('/:id/members/:userId', isProjectAdmin, removeMember);
router.put('/:id/members/:userId/role', isProjectAdmin, updateMemberRole);

module.exports = router;