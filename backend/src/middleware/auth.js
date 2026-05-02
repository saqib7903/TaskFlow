const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return res.status(401).json({ message: 'Not authorized. No token provided.' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to perform this action.' });
    }
    next();
  };
};

exports.isProjectAdmin = async (req, res, next) => {
  const Project = require('../models/Project');
  try {
    const project = await Project.findById(req.params.projectId || req.body.project);
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    const member = project.members.find(m => m.user.toString() === req.user._id.toString());
    const isOwner = project.owner.toString() === req.user._id.toString();
    const isSiteAdmin = req.user.role === 'admin';

    if (!isOwner && !(member && member.role === 'admin') && !isSiteAdmin) {
      return res.status(403).json({ message: 'Only project admins can perform this action.' });
    }
    req.project = project;
    next();
  } catch (err) {
    next(err);
  }
};

exports.isProjectMember = async (req, res, next) => {
  const Project = require('../models/Project');
  try {
    const projectId = req.params.projectId || req.body.project || req.query.project;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    const isMember = project.members.some(m => m.user.toString() === req.user._id.toString());
    const isOwner = project.owner.toString() === req.user._id.toString();
    const isSiteAdmin = req.user.role === 'admin';

    if (!isMember && !isOwner && !isSiteAdmin) {
      return res.status(403).json({ message: 'You are not a member of this project.' });
    }
    req.project = project;
    next();
  } catch (err) {
    next(err);
  }
};