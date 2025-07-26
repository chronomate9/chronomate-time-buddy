import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Check, 
  X, 
  Clock, 
  Flag, 
  Filter, 
  Calendar,
  Star,
  MoreVertical,
  Edit3,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { dataService, type Task } from '@/services/dataService';
import { format } from 'date-fns';

interface SmartTodoListProps {
  onTaskUpdate?: (task: Task) => void;
  onTaskCreated?: (task: Task) => void;
  className?: string;
}

export const SmartTodoList: React.FC<SmartTodoListProps> = ({
  onTaskUpdate,
  onTaskCreated,
  className = ""
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<'all' | 'today' | 'completed' | 'pending'>('all');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [selectedPriority, setSelectedPriority] = useState<'low' | 'medium' | 'high'>('medium');

  // Load tasks
  useEffect(() => {
    loadTasks();
  }, [filter]);

  const loadTasks = () => {
    let taskFilter: any = {};
    
    switch (filter) {
      case 'today':
        taskFilter = { dueToday: true, completed: false };
        break;
      case 'completed':
        taskFilter = { completed: true };
        break;
      case 'pending':
        taskFilter = { completed: false };
        break;
      default:
        taskFilter = {};
    }
    
    const filteredTasks = dataService.getTasks(taskFilter);
    setTasks(filteredTasks);
  };

  // Create new task
  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) return;

    const task = dataService.createTask({
      title: newTaskTitle,
      priority: selectedPriority,
      category: selectedCategory,
      tags: [],
      dueDate: filter === 'today' ? new Date() : undefined
    });

    setTasks(prev => [task, ...prev]);
    setNewTaskTitle('');
    setShowAddTask(false);
    onTaskCreated?.(task);
  };

  // Toggle task completion
  const handleToggleTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedTask = dataService.updateTask(taskId, {
      completed: !task.completed
    });

    if (updatedTask) {
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
      onTaskUpdate?.(updatedTask);
      
      if (updatedTask.completed) {
        // Show celebration for completed task
        // You can integrate confetti here
      }
    }
  };

  // Delete task
  const handleDeleteTask = (taskId: string) => {
    dataService.deleteTask(taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  // Update task priority
  const handleUpdatePriority = (taskId: string, priority: 'low' | 'medium' | 'high') => {
    const updatedTask = dataService.updateTask(taskId, { priority });
    if (updatedTask) {
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
      onTaskUpdate?.(updatedTask);
    }
  };

  const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'low': return 'text-green-500 bg-green-500/10 border-green-500/20';
    }
  };

  const getPriorityIcon = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high': return <Flag className="w-4 h-4" />;
      case 'medium': return <Clock className="w-4 h-4" />;
      case 'low': return <Star className="w-4 h-4" />;
    }
  };

  const getCategoryEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      work: '💼',
      personal: '🏠',
      health: '🏥',
      shopping: '🛒',
      fitness: '💪',
      learning: '📚',
      general: '📝'
    };
    return emojis[category] || '📝';
  };

  const filterCounts = {
    all: tasks.length,
    today: tasks.filter(t => !t.completed && t.dueDate && 
      new Date(t.dueDate).toDateString() === new Date().toDateString()).length,
    pending: tasks.filter(t => !t.completed).length,
    completed: tasks.filter(t => t.completed).length
  };

  return (
    <div className={`w-full ${className}`}>
      <Card className="glass-strong p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold gradient-text mb-1">Smart Tasks</h2>
            <p className="text-sm text-muted-foreground">
              {filterCounts.pending} pending • {filterCounts.completed} completed
            </p>
          </div>
          
          <Button
            onClick={() => setShowAddTask(true)}
            className="rounded-full bg-primary hover:bg-primary/80"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Task
          </Button>
        </div>

        {/* Filters */}
        <div className="flex space-x-2 mb-6 overflow-x-auto">
          {(['all', 'today', 'pending', 'completed'] as const).map((filterType) => (
            <Button
              key={filterType}
              variant={filter === filterType ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(filterType)}
              className="whitespace-nowrap rounded-full"
            >
              <span className="capitalize">{filterType}</span>
              <Badge variant="secondary" className="ml-2 text-xs">
                {filterCounts[filterType]}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Add Task Form */}
        <AnimatePresence>
          {showAddTask && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <Card className="p-4 bg-muted/20">
                <div className="space-y-3">
                  <Input
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="What needs to be done?"
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateTask()}
                    className="bg-background/50"
                    autoFocus
                  />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-3 py-1 bg-background/50 border border-border rounded-lg text-sm"
                      >
                        <option value="general">General</option>
                        <option value="work">Work</option>
                        <option value="personal">Personal</option>
                        <option value="health">Health</option>
                        <option value="shopping">Shopping</option>
                        <option value="fitness">Fitness</option>
                        <option value="learning">Learning</option>
                      </select>
                      
                      <select
                        value={selectedPriority}
                        onChange={(e) => setSelectedPriority(e.target.value as any)}
                        className="px-3 py-1 bg-background/50 border border-border rounded-lg text-sm"
                      >
                        <option value="low">Low Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="high">High Priority</option>
                      </select>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddTask(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleCreateTask}
                        disabled={!newTaskTitle.trim()}
                      >
                        Add Task
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tasks List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          <AnimatePresence>
            {tasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.05 }}
                className={`
                  group relative p-4 rounded-xl border transition-all duration-200
                  ${task.completed 
                    ? 'bg-muted/20 border-border/20 opacity-60' 
                    : 'bg-background/50 border-border/50 hover:bg-muted/30'
                  }
                `}
              >
                <div className="flex items-center space-x-3">
                  {/* Checkbox */}
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className="flex-shrink-0"
                  >
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={() => handleToggleTask(task.id)}
                      className="w-5 h-5"
                    />
                  </motion.div>

                  {/* Task Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-lg">{getCategoryEmoji(task.category)}</span>
                      <h3 className={`font-medium truncate ${
                        task.completed ? 'line-through text-muted-foreground' : ''
                      }`}>
                        {task.title}
                      </h3>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <Badge 
                        variant="outline" 
                        className={`${getPriorityColor(task.priority)} border`}
                      >
                        {getPriorityIcon(task.priority)}
                        <span className="ml-1 capitalize">{task.priority}</span>
                      </Badge>
                      
                      <Badge variant="outline" className="capitalize">
                        {task.category}
                      </Badge>
                      
                      {task.dueDate && (
                        <Badge variant="outline" className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {format(task.dueDate, 'MMM d')}
                        </Badge>
                      )}
                      
                      <span className="text-xs opacity-60">
                        {format(task.createdAt, 'MMM d, HH:mm')}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-8 h-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleUpdatePriority(task.id, 'high')}
                          className="text-red-600"
                        >
                          <Flag className="w-4 h-4 mr-2" />
                          High Priority
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleUpdatePriority(task.id, 'medium')}
                          className="text-yellow-600"
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          Medium Priority
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleUpdatePriority(task.id, 'low')}
                          className="text-green-600"
                        >
                          <Star className="w-4 h-4 mr-2" />
                          Low Priority
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Progress indicator for completed tasks */}
                {task.completed && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    className="absolute bottom-0 left-0 h-1 bg-green-500 rounded-full"
                    style={{ width: '100%' }}
                  />
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {tasks.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-muted-foreground"
            >
              <div className="text-4xl mb-2">📝</div>
              <p>No tasks yet. Add one to get started!</p>
            </motion.div>
          )}
        </div>

        {/* Quick Stats */}
        {tasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 pt-4 border-t border-border/20"
          >
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-primary">
                  {Math.round((filterCounts.completed / tasks.length) * 100)}%
                </div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
              <div>
                <div className="text-lg font-bold text-orange-500">
                  {tasks.filter(t => t.priority === 'high' && !t.completed).length}
                </div>
                <div className="text-xs text-muted-foreground">High Priority</div>
              </div>
              <div>
                <div className="text-lg font-bold text-blue-500">
                  {tasks.filter(t => t.dueDate && new Date(t.dueDate).toDateString() === new Date().toDateString()).length}
                </div>
                <div className="text-xs text-muted-foreground">Due Today</div>
              </div>
            </div>
          </motion.div>
        )}
      </Card>
    </div>
  );
};