import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import { Briefcase, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
  });
  const [recentTasks, setRecentTasks] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [projectsRes, tasksRes] = await Promise.all([
          api.get('/projects'),
          api.get('/tasks')
        ]);
        
        const tasks = tasksRes.data;
        const projects = projectsRes.data;
        
        setStats({
          totalProjects: projects.length,
          totalTasks: tasks.length,
          completedTasks: tasks.filter(t => t.status === 'Done').length,
          inProgressTasks: tasks.filter(t => t.status === 'In Progress').length,
        });
        
        // Get 5 most recently updated tasks
        setRecentTasks(tasks.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5));
      } catch (error) {
        console.error('Error fetching dashboard data', error);
      }
    };
    
    fetchDashboardData();
  }, []);

  const StatCard = ({ title, value, icon: Icon, colorClass }) => (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className={`h-6 w-6 ${colorClass}`} aria-hidden="true" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="text-3xl font-semibold text-gray-900">{value}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Welcome back, {user.name}!</h1>
      
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard title="Total Projects" value={stats.totalProjects} icon={Briefcase} colorClass="text-blue-500" />
        <StatCard title="Total Tasks" value={stats.totalTasks} icon={Clock} colorClass="text-yellow-500" />
        <StatCard title="In Progress" value={stats.inProgressTasks} icon={AlertCircle} colorClass="text-orange-500" />
        <StatCard title="Completed Tasks" value={stats.completedTasks} icon={CheckCircle} colorClass="text-green-500" />
      </div>

      <div className="bg-white shadow rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Tasks</h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {recentTasks.length === 0 ? (
            <li className="px-4 py-4 text-gray-500">No tasks found.</li>
          ) : (
            recentTasks.map(task => (
              <li key={task.id} className="px-4 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-primary truncate">{task.title}</p>
                  <div className="ml-2 flex-shrink-0 flex">
                    <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${task.status === 'Done' ? 'bg-green-100 text-green-800' : 
                        task.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-gray-100 text-gray-800'}`}>
                      {task.status}
                    </p>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex text-sm text-gray-500">
                    <p>Project: {task.project?.title || 'Unknown'}</p>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;
