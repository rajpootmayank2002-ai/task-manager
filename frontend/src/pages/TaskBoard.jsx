import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { Plus } from 'lucide-react';

const TaskBoard = () => {
  const { projectId } = useParams();
  const { user } = useContext(AuthContext);
  const [tasks, setTasks] = useState({
    'To Do': [],
    'In Progress': [],
    'Done': []
  });
  
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '', description: '', status: 'To Do', priority: 'Medium', assignedTo: ''
  });

  useEffect(() => {
    fetchTasks();
    if (user.role === 'Admin') {
      fetchUsers();
    }
  }, [projectId]);

  const fetchTasks = async () => {
    try {
      const { data } = await api.get('/tasks');
      const projectTasks = data.filter(t => String(t.projectId) === String(projectId));
      
      const organized = {
        'To Do': projectTasks.filter(t => t.status === 'To Do'),
        'In Progress': projectTasks.filter(t => t.status === 'In Progress'),
        'Done': projectTasks.filter(t => t.status === 'Done'),
      };
      setTasks(organized);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination } = result;

    if (source.droppableId !== destination.droppableId) {
      const sourceCol = [...tasks[source.droppableId]];
      const destCol = [...tasks[destination.droppableId]];
      const [removed] = sourceCol.splice(source.index, 1);
      
      // Update status
      removed.status = destination.droppableId;
      destCol.splice(destination.index, 0, removed);

      setTasks({
        ...tasks,
        [source.droppableId]: sourceCol,
        [destination.droppableId]: destCol,
      });

      try {
        await api.put(`/tasks/${removed.id}`, { status: removed.status });
      } catch (error) {
        console.error('Error updating task status', error);
        // Revert UI on failure can be implemented here
      }
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tasks', { ...newTask, projectId });
      setIsModalOpen(false);
      setNewTask({ title: '', description: '', status: 'To Do', priority: 'Medium', assignedTo: '' });
      fetchTasks();
    } catch (error) {
      console.error(error);
    }
  };

  const priorityColors = {
    Low: 'bg-blue-100 text-blue-800',
    Medium: 'bg-yellow-100 text-yellow-800',
    High: 'bg-red-100 text-red-800'
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Task Board</h1>
        {user.role === 'Admin' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus size={18} /> Add Task
          </button>
        )}
      </div>

      <div className="flex-grow flex gap-6 overflow-x-auto pb-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          {Object.entries(tasks).map(([columnId, columnTasks]) => (
            <div key={columnId} className="flex-1 min-w-[300px] bg-gray-200 rounded-lg p-4 flex flex-col max-h-full">
              <h2 className="font-semibold text-gray-700 mb-4 flex justify-between items-center">
                {columnId}
                <span className="bg-gray-300 text-gray-700 py-0.5 px-2.5 rounded-full text-xs">{columnTasks.length}</span>
              </h2>
              <Droppable droppableId={columnId}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`flex-grow overflow-y-auto space-y-3 p-1 rounded-md transition-colors ${snapshot.isDraggingOver ? 'bg-gray-300' : ''}`}
                  >
                    {columnTasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-white p-4 rounded shadow-sm border border-gray-100 ${snapshot.isDragging ? 'shadow-lg rotate-1' : 'hover:shadow-md'} transition-all`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-gray-900">{task.title}</h4>
                            </div>
                            <p className="text-sm text-gray-500 line-clamp-2 mb-3">{task.description}</p>
                            <div className="flex justify-between items-center text-xs">
                              <span className={`px-2 py-1 rounded-md font-medium ${priorityColors[task.priority]}`}>
                                {task.priority}
                              </span>
                              {task.assignee && (
                                <div className="flex items-center gap-1 text-gray-600 font-medium">
                                  <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center">
                                    {task.assignee.name ? task.assignee.name.charAt(0).toUpperCase() : 'U'}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </DragDropContext>
      </div>

      {/* Create Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative p-8 bg-white w-full max-w-md m-auto flex-col flex rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Create New Task</h2>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  value={newTask.title}
                  onChange={e => setNewTask({...newTask, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  rows="3"
                  value={newTask.description}
                  onChange={e => setNewTask({...newTask, description: e.target.value})}
                ></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    value={newTask.status}
                    onChange={e => setNewTask({...newTask, status: e.target.value})}
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <select
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    value={newTask.priority}
                    onChange={e => setNewTask({...newTask, priority: e.target.value})}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Assign To</label>
                <select
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  value={newTask.assignedTo}
                  onChange={e => setNewTask({...newTask, assignedTo: e.target.value})}
                >
                  <option value="">Unassigned</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-white border border-gray-300 rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskBoard;
