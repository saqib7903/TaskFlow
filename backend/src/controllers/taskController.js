const { validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');

exports.getTasks = async (req, res, next) => {
  try {
    const { project, status, priority, assignee, overdue } = req.query;
    const filter = {};

    if (project) filter.project = project;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignee) filter.assignee = assignee;
    if (overdue === 'true') {
      filter.dueDate = { $lt: new Date() };
      filter.status = { $ne: 'done' };
    }

    // Non-admins only see tasks in their projects
    if (req.user.role !== 'admin') {
      const userProjects = await Project.find({
        $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
      }).select('_id');
      const projectIds = userProjects.map(p => p._id);
      if (filter.project) {
        if (!projectIds.map(String).includes(String(filter.project))) {
          return res.status(403).json({ message: 'Access denied.' });
        }
      } else {
        filter.project = { $in: projectIds };
      }
    }

    const tasks = await Task.find(filter)
      .populate('assignee', 'name avatar email')
      .populate('createdBy', 'name avatar')
      .populate('project', 'name color')
      .sort({ order: 1, createdAt: -1 });

    res.json({ tasks });
  } catch (err) {
    next(err);
  }
};

exports.getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'name avatar email')
      .populate('createdBy', 'name avatar')
      .populate('project', 'name color members owner')
      .populate('comments.user', 'name avatar');

    if (!task) return res.status(404).json({ message: 'Task not found.' });
    res.json({ task });
  } catch (err) {
    next(err);
  }
};

exports.createTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { title, description, status, priority, project, assignee, dueDate, tags } = req.body;

    const task = await Task.create({
      title, description, status, priority, project, assignee, dueDate, tags,
      createdBy: req.user._id,
    });

    await task.populate('assignee', 'name avatar email');
    await task.populate('createdBy', 'name avatar');
    await task.populate('project', 'name color');

    res.status(201).json({ task });
  } catch (err) {
    next(err);
  }
};

exports.updateTask = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    })
      .populate('assignee', 'name avatar email')
      .populate('createdBy', 'name avatar')
      .populate('project', 'name color')
      .populate('comments.user', 'name avatar');

    if (!task) return res.status(404).json({ message: 'Task not found.' });
    res.json({ task });
  } catch (err) {
    next(err);
  }
};

exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    res.json({ message: 'Task deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

exports.addComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Comment text is required.' });

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    task.comments.push({ user: req.user._id, text });
    await task.save();
    await task.populate('comments.user', 'name avatar');

    res.status(201).json({ comments: task.comments });
  } catch (err) {
    next(err);
  }
};

exports.getMyTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find({ assignee: req.user._id })
      .populate('project', 'name color')
      .populate('createdBy', 'name avatar')
      .sort({ dueDate: 1, createdAt: -1 });
    res.json({ tasks });
  } catch (err) {
    next(err);
  }
};