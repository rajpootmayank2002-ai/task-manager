const sequelize = require('../config/db');
const User = require('./User');
const Project = require('./Project');
const Task = require('./Task');

// Associations
// Project & User (Creator)
Project.belongsTo(User, { as: 'Creator', foreignKey: 'createdBy' });
User.hasMany(Project, { foreignKey: 'createdBy' });

// Project & User (Members - Many-to-Many)
Project.belongsToMany(User, { through: 'ProjectMembers', as: 'members', foreignKey: 'projectId' });
User.belongsToMany(Project, { through: 'ProjectMembers', as: 'projects', foreignKey: 'userId' });

// Task & Project
Task.belongsTo(Project, { as: 'project', foreignKey: 'projectId' });
Project.hasMany(Task, { foreignKey: 'projectId', onDelete: 'CASCADE' });

// Task & User (Assignee)
Task.belongsTo(User, { as: 'assignee', foreignKey: 'assignedTo' });
User.hasMany(Task, { foreignKey: 'assignedTo' });

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('MySQL Connected');
    await sequelize.sync({ alter: true }); // Syncs models
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB, User, Project, Task };
