const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');

exports.getDashboard = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';

    // Get accessible projects
    const projectQuery = isAdmin
      ? {}
      : { $or: [{ owner: req.user._id }, { 'members.user': req.user._id }] };

    const projects = await Project.find(projectQuery).select('_id name color status');
    const projectIds = projects.map(p => p._id);

    // Task stats
    const taskQuery = isAdmin ? {} : { project: { $in: projectIds } };
    const allTasks = await Task.find(taskQuery);
    const myTasks = await Task.find({ assignee: req.user._id })
      .populate('project', 'name color')
      .sort({ dueDate: 1 })
      .limit(5);

    const now = new Date();
    const stats = {
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === 'active').length,
      totalTasks: allTasks.length,
      todo: allTasks.filter(t => t.status === 'todo').length,
      inProgress: allTasks.filter(t => t.status === 'in-progress').length,
      review: allTasks.filter(t => t.status === 'review').length,
      done: allTasks.filter(t => t.status === 'done').length,
      overdue: allTasks.filter(t => t.status !== 'done' && t.dueDate && now > new Date(t.dueDate)).length,
      myTasks: allTasks.filter(t => t.assignee?.toString() === req.user._id.toString()).length,
    };

    // Recent activity (recent tasks)
    const recentTasks = await Task.find(taskQuery)
      .populate('assignee', 'name avatar')
      .populate('project', 'name color')
      .populate('createdBy', 'name')
      .sort('-updatedAt')
      .limit(8);

    // Overdue tasks
    const overdueTasks = await Task.find({
      ...taskQuery,
      status: { $ne: 'done' },
      dueDate: { $lt: now },
    })
      .populate('assignee', 'name avatar')
      .populate('project', 'name color')
      .sort('dueDate')
      .limit(5);

    // Team members (admin only)
    let teamStats = null;
    if (isAdmin) {
      const totalUsers = await User.countDocuments();
      const admins = await User.countDocuments({ role: 'admin' });
      teamStats = { totalUsers, admins, members: totalUsers - admins };
    }

    res.json({ stats, recentTasks, overdueTasks, myTasks, teamStats, projects });
  } catch (err) {
    next(err);
  }
};