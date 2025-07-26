import { v4 as uuidv4 } from 'uuid';

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  category: string;
  createdAt: Date;
  completedAt?: Date;
  tags: string[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  allDay: boolean;
  category: 'work' | 'personal' | 'health' | 'social' | 'other';
  color: string;
  reminder?: {
    enabled: boolean;
    minutes: number;
  };
  repeat?: {
    type: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: Date;
  };
  location?: string;
  attendees?: string[];
}

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  scheduledTime: Date;
  completed: boolean;
  snoozed?: boolean;
  snoozeUntil?: Date;
  priority: 'low' | 'medium' | 'high';
  category: string;
  repeat?: {
    type: 'minutes' | 'hours' | 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: Date;
  };
  notificationMethod: 'popup' | 'sound' | 'voice' | 'all';
  createdAt: Date;
}

export interface UserData {
  id: string;
  name: string;
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    notifications: boolean;
    voice: boolean;
    reminderTone: 'friendly' | 'professional' | 'playful';
    workingHours: {
      start: string;
      end: string;
      days: string[];
    };
  };
  habits: Array<{
    id: string;
    name: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    streak: number;
    lastCompleted?: Date;
  }>;
  mood: {
    current: string;
    history: Array<{
      date: Date;
      mood: string;
      notes?: string;
    }>;
  };
  analytics: {
    tasksCompleted: number;
    currentStreak: number;
    longestStreak: number;
    mostProductiveHour: number;
    averageTasksPerDay: number;
  };
}

class DataService {
  private tasks: Task[] = [];
  private events: CalendarEvent[] = [];
  private reminders: Reminder[] = [];
  private userData: UserData;

  constructor() {
    this.loadData();
    this.userData = this.loadUserData();
    this.setupNotificationPolling();
  }

  // Data persistence
  private saveData() {
    localStorage.setItem('chronomate_tasks', JSON.stringify(this.tasks));
    localStorage.setItem('chronomate_events', JSON.stringify(this.events));
    localStorage.setItem('chronomate_reminders', JSON.stringify(this.reminders));
    localStorage.setItem('chronomate_user_data', JSON.stringify(this.userData));
  }

  private loadData() {
    try {
      const tasks = localStorage.getItem('chronomate_tasks');
      const events = localStorage.getItem('chronomate_events');
      const reminders = localStorage.getItem('chronomate_reminders');

      if (tasks) {
        this.tasks = JSON.parse(tasks).map((task: any) => ({
          ...task,
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          createdAt: new Date(task.createdAt),
          completedAt: task.completedAt ? new Date(task.completedAt) : undefined
        }));
      }

      if (events) {
        this.events = JSON.parse(events).map((event: any) => ({
          ...event,
          start: new Date(event.start),
          end: new Date(event.end),
          repeat: event.repeat ? {
            ...event.repeat,
            endDate: event.repeat.endDate ? new Date(event.repeat.endDate) : undefined
          } : undefined
        }));
      }

      if (reminders) {
        this.reminders = JSON.parse(reminders).map((reminder: any) => ({
          ...reminder,
          scheduledTime: new Date(reminder.scheduledTime),
          snoozeUntil: reminder.snoozeUntil ? new Date(reminder.snoozeUntil) : undefined,
          createdAt: new Date(reminder.createdAt),
          repeat: reminder.repeat ? {
            ...reminder.repeat,
            endDate: reminder.repeat.endDate ? new Date(reminder.repeat.endDate) : undefined
          } : undefined
        }));
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
    }
  }

  private loadUserData(): UserData {
    try {
      const userData = localStorage.getItem('chronomate_user_data');
      if (userData) {
        const parsed = JSON.parse(userData);
        return {
          ...parsed,
          mood: {
            ...parsed.mood,
            history: parsed.mood.history.map((entry: any) => ({
              ...entry,
              date: new Date(entry.date)
            }))
          },
          habits: parsed.habits.map((habit: any) => ({
            ...habit,
            lastCompleted: habit.lastCompleted ? new Date(habit.lastCompleted) : undefined
          }))
        };
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }

    // Default user data
    return {
      id: uuidv4(),
      name: 'User',
      preferences: {
        theme: 'auto',
        notifications: true,
        voice: true,
        reminderTone: 'friendly',
        workingHours: {
          start: '09:00',
          end: '17:00',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
        }
      },
      habits: [],
      mood: {
        current: 'neutral',
        history: []
      },
      analytics: {
        tasksCompleted: 0,
        currentStreak: 0,
        longestStreak: 0,
        mostProductiveHour: 10,
        averageTasksPerDay: 0
      }
    };
  }

  // Task management
  createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'completed'>): Task {
    const task: Task = {
      id: uuidv4(),
      completed: false,
      createdAt: new Date(),
      tags: [],
      ...taskData
    };
    
    this.tasks.push(task);
    this.saveData();
    return task;
  }

  getTasks(filter?: { completed?: boolean; category?: string; dueToday?: boolean }): Task[] {
    let filteredTasks = [...this.tasks];

    if (filter) {
      if (filter.completed !== undefined) {
        filteredTasks = filteredTasks.filter(task => task.completed === filter.completed);
      }
      if (filter.category) {
        filteredTasks = filteredTasks.filter(task => task.category === filter.category);
      }
      if (filter.dueToday) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        filteredTasks = filteredTasks.filter(task => 
          task.dueDate && task.dueDate >= today && task.dueDate < tomorrow
        );
      }
    }

    return filteredTasks.sort((a, b) => {
      // Sort by priority, then by due date
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      if (a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime();
      }
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }

  updateTask(id: string, updates: Partial<Task>): Task | null {
    const taskIndex = this.tasks.findIndex(task => task.id === id);
    if (taskIndex === -1) return null;

    if (updates.completed && !this.tasks[taskIndex].completed) {
      updates.completedAt = new Date();
      this.updateAnalytics('taskCompleted');
    }

    this.tasks[taskIndex] = { ...this.tasks[taskIndex], ...updates };
    this.saveData();
    return this.tasks[taskIndex];
  }

  deleteTask(id: string): boolean {
    const initialLength = this.tasks.length;
    this.tasks = this.tasks.filter(task => task.id !== id);
    if (this.tasks.length < initialLength) {
      this.saveData();
      return true;
    }
    return false;
  }

  // Calendar event management
  createEvent(eventData: Omit<CalendarEvent, 'id'>): CalendarEvent {
    const event: CalendarEvent = {
      id: uuidv4(),
      ...eventData
    };
    
    this.events.push(event);
    this.saveData();
    return event;
  }

  getEvents(filter?: { start?: Date; end?: Date; category?: string }): CalendarEvent[] {
    let filteredEvents = [...this.events];

    if (filter) {
      if (filter.start && filter.end) {
        filteredEvents = filteredEvents.filter(event => 
          event.start >= filter.start! && event.start <= filter.end!
        );
      }
      if (filter.category) {
        filteredEvents = filteredEvents.filter(event => event.category === filter.category);
      }
    }

    return filteredEvents.sort((a, b) => a.start.getTime() - b.start.getTime());
  }

  updateEvent(id: string, updates: Partial<CalendarEvent>): CalendarEvent | null {
    const eventIndex = this.events.findIndex(event => event.id === id);
    if (eventIndex === -1) return null;

    this.events[eventIndex] = { ...this.events[eventIndex], ...updates };
    this.saveData();
    return this.events[eventIndex];
  }

  deleteEvent(id: string): boolean {
    const initialLength = this.events.length;
    this.events = this.events.filter(event => event.id !== id);
    if (this.events.length < initialLength) {
      this.saveData();
      return true;
    }
    return false;
  }

  // Reminder management
  createReminder(reminderData: Omit<Reminder, 'id' | 'createdAt' | 'completed'>): Reminder {
    const reminder: Reminder = {
      id: uuidv4(),
      completed: false,
      createdAt: new Date(),
      ...reminderData
    };
    
    this.reminders.push(reminder);
    this.saveData();
    return reminder;
  }

  getReminders(filter?: { completed?: boolean; category?: string }): Reminder[] {
    let filteredReminders = [...this.reminders];

    if (filter) {
      if (filter.completed !== undefined) {
        filteredReminders = filteredReminders.filter(reminder => reminder.completed === filter.completed);
      }
      if (filter.category) {
        filteredReminders = filteredReminders.filter(reminder => reminder.category === filter.category);
      }
    }

    return filteredReminders.sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
  }

  updateReminder(id: string, updates: Partial<Reminder>): Reminder | null {
    const reminderIndex = this.reminders.findIndex(reminder => reminder.id === id);
    if (reminderIndex === -1) return null;

    this.reminders[reminderIndex] = { ...this.reminders[reminderIndex], ...updates };
    this.saveData();
    return this.reminders[reminderIndex];
  }

  snoozeReminder(id: string, minutes: number): boolean {
    const reminder = this.reminders.find(r => r.id === id);
    if (!reminder) return false;

    const snoozeUntil = new Date();
    snoozeUntil.setMinutes(snoozeUntil.getMinutes() + minutes);

    this.updateReminder(id, {
      snoozed: true,
      snoozeUntil: snoozeUntil
    });

    return true;
  }

  // User data management
  getUserData(): UserData {
    return { ...this.userData };
  }

  updateUserData(updates: Partial<UserData>): UserData {
    this.userData = { ...this.userData, ...updates };
    this.saveData();
    return this.userData;
  }

  updateMood(mood: string, notes?: string): void {
    this.userData.mood.current = mood;
    this.userData.mood.history.push({
      date: new Date(),
      mood,
      notes
    });

    // Keep only last 30 days of mood history
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    this.userData.mood.history = this.userData.mood.history.filter(
      entry => entry.date >= thirtyDaysAgo
    );

    this.saveData();
  }

  private updateAnalytics(action: 'taskCompleted'): void {
    switch (action) {
      case 'taskCompleted':
        this.userData.analytics.tasksCompleted++;
        // Update streak logic here
        break;
    }
  }

  // Notification system
  private setupNotificationPolling(): void {
    setInterval(() => {
      this.checkDueReminders();
    }, 60000); // Check every minute
  }

  private checkDueReminders(): void {
    const now = new Date();
    const dueReminders = this.reminders.filter(reminder => 
      !reminder.completed && 
      !reminder.snoozed && 
      reminder.scheduledTime <= now
    );

    dueReminders.forEach(reminder => {
      this.triggerNotification(reminder);
    });
  }

  private async triggerNotification(reminder: Reminder): Promise<void> {
    // Web Push Notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(reminder.title, {
        body: reminder.description,
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });
    }

    // Voice notification if enabled
    if (this.userData.preferences.voice && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(
        `Reminder: ${reminder.title}`
      );
      speechSynthesis.speak(utterance);
    }

    // Custom event for in-app notifications
    window.dispatchEvent(new CustomEvent('chronomate-reminder', {
      detail: reminder
    }));
  }

  // Request notification permission
  async requestNotificationPermission(): Promise<boolean> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  // Analytics and insights
  getProductivityInsights() {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const recentTasks = this.tasks.filter(task => 
      task.createdAt >= weekAgo
    );
    
    const completedTasks = recentTasks.filter(task => task.completed);
    const completionRate = recentTasks.length > 0 ? 
      (completedTasks.length / recentTasks.length) * 100 : 0;
    
    return {
      weeklyCompletionRate: Math.round(completionRate),
      totalTasks: this.tasks.length,
      completedTasks: this.tasks.filter(t => t.completed).length,
      pendingTasks: this.tasks.filter(t => !t.completed).length,
      overdueTasks: this.tasks.filter(t => 
        !t.completed && t.dueDate && t.dueDate < now
      ).length
    };
  }
}

export const dataService = new DataService();