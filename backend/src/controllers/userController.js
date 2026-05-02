const User = require('../models/User');
const Task = require('../models/Task');

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort('name');
    res.json({ users });
  } catch (err) {
    next(err);
  }
};

exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role.' });
    }
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot change your own role.' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete yourself.' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    await Task.updateMany({ assignee: req.params.id }, { $unset: { assignee: 1 } });
    res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    next(err);
  }
};