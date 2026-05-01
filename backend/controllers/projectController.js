const { Project, User, Task } = require('../models');

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
  try {
    let projects;
    if (req.user.role === 'Admin') {
      projects = await Project.findAll({
        include: [
          { model: User, as: 'members', attributes: ['id', 'name', 'email'] },
          { model: User, as: 'Creator', attributes: ['id', 'name', 'email'] }
        ]
      });
    } else {
      projects = await Project.findAll({
        include: [
          { 
            model: User, 
            as: 'members', 
            attributes: ['id', 'name', 'email'],
            where: { id: req.user.id } // Filter where user is a member
          },
          { model: User, as: 'Creator', attributes: ['id', 'name', 'email'] }
        ]
      });
    }
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a project
// @route   POST /api/projects
// @access  Private/Admin
const createProject = async (req, res) => {
  try {
    const { title, description, deadline, members } = req.body;
    
    const project = await Project.create({
      title,
      description,
      deadline,
      createdBy: req.user.id,
    });

    if (members && members.length > 0) {
      await project.setMembers(members);
    }

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private/Admin
const updateProject = async (req, res) => {
  try {
    const { title, description, deadline, members } = req.body;
    const project = await Project.findByPk(req.params.id);

    if (project) {
      await project.update({
        title: title || project.title,
        description: description || project.description,
        deadline: deadline || project.deadline
      });

      if (members) {
        await project.setMembers(members);
      }

      res.json(project);
    } else {
      res.status(404).json({ message: 'Project not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Private/Admin
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);

    if (project) {
      // Manually delete associated tasks and members to prevent foreign key constraint fails
      await Task.destroy({ where: { projectId: project.id } });
      await project.setMembers([]); // Remove all rows in the join table
      
      await project.destroy();
      res.json({ message: 'Project removed' });
    } else {
      res.status(404).json({ message: 'Project not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getProjects, createProject, updateProject, deleteProject };

