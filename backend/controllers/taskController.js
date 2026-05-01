const { Task, Project, User } = require('../models');

// @desc    Get tasks
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
  try {
    let tasks;
    if (req.user.role === 'Admin') {
      tasks = await Task.findAll({
        include: [
          { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
          { model: Project, as: 'project', attributes: ['id', 'title'] }
        ]
      });
    } else {
      tasks = await Task.findAll({
        where: { assignedTo: req.user.id },
        include: [
          { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
          { model: Project, as: 'project', attributes: ['id', 'title'] }
        ]
      });
    }
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a task
// @route   POST /api/tasks
// @access  Private/Admin
const createTask = async (req, res) => {
  try {
    const { title, description, projectId, assignedTo, status, priority, dueDate } = req.body;

    const task = await Task.create({
      title,
      description,
      projectId,
      assignedTo: assignedTo || null,
      status,
      priority,
      dueDate,
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
  try {
    const { title, description, assignedTo, status, priority, dueDate } = req.body;
    const task = await Task.findByPk(req.params.id);

    if (task) {
      if (req.user.role !== 'Admin') {
        task.status = status || task.status;
      } else {
        task.title = title || task.title;
        task.description = description || task.description;
        task.assignedTo = assignedTo || task.assignedTo;
        task.status = status || task.status;
        task.priority = priority || task.priority;
        task.dueDate = dueDate || task.dueDate;
      }

      await task.save();
      res.json(task);
    } else {
      res.status(404).json({ message: 'Task not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private/Admin
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);

    if (task) {
      await task.destroy();
      res.json({ message: 'Task removed' });
    } else {
      res.status(404).json({ message: 'Task not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getTasks, createTask, updateTask, deleteTask };

