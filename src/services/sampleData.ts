import { dataService } from './dataService';
import { addDays, addHours, addMinutes } from 'date-fns';

export const initializeSampleData = () => {
  // Check if data already exists
  const existingTasks = dataService.getTasks();
  if (existingTasks.length > 0) {
    return; // Data already exists
  }

  const now = new Date();

  // Sample Tasks
  const sampleTasks = [
    {
      title: "Review quarterly goals",
      description: "Analyze Q3 performance and set Q4 objectives",
      priority: 'high' as const,
      category: 'work',
      dueDate: addDays(now, 1),
      tags: ['planning', 'goals']
    },
    {
      title: "Buy groceries",
      description: "Weekly grocery shopping - milk, eggs, vegetables",
      priority: 'medium' as const,
      category: 'personal',
      dueDate: addDays(now, 2),
      tags: ['shopping', 'essentials']
    },
    {
      title: "Morning workout",
      description: "30 minutes cardio + strength training",
      priority: 'medium' as const,
      category: 'health',
      dueDate: addDays(now, 1),
      tags: ['fitness', 'health']
    },
    {
      title: "Read 20 pages of productivity book",
      description: "Continue reading 'Atomic Habits'",
      priority: 'low' as const,
      category: 'learning',
      dueDate: addDays(now, 3),
      tags: ['reading', 'self-improvement']
    },
    {
      title: "Call mom",
      description: "Weekly check-in call with family",
      priority: 'high' as const,
      category: 'personal',
      dueDate: now,
      tags: ['family', 'important']
    },
    {
      title: "Prepare presentation slides",
      description: "Create slides for next week's team meeting",
      priority: 'high' as const,
      category: 'work',
      dueDate: addDays(now, 4),
      tags: ['presentation', 'work']
    },
    {
      title: "Organize desk workspace",
      description: "Clean and organize home office setup",
      priority: 'low' as const,
      category: 'personal',
      tags: ['organization', 'productivity']
    },
    {
      title: "Schedule dentist appointment",
      description: "6-month dental checkup",
      priority: 'medium' as const,
      category: 'health',
      tags: ['healthcare', 'appointments']
    }
  ];

  // Sample Calendar Events
  const sampleEvents = [
    {
      title: "Team Standup",
      description: "Daily team sync meeting",
      start: addHours(now, 2),
      end: addHours(now, 2.5),
      allDay: false,
      category: 'work' as const,
      color: '#3b82f6',
      location: "Conference Room A"
    },
    {
      title: "Lunch with Sarah",
      description: "Catch up over lunch",
      start: addHours(addDays(now, 1), 12),
      end: addHours(addDays(now, 1), 13.5),
      allDay: false,
      category: 'social' as const,
      color: '#8b5cf6',
      location: "Downtown Cafe"
    },
    {
      title: "Doctor Appointment",
      description: "Annual health checkup",
      start: addHours(addDays(now, 3), 14),
      end: addHours(addDays(now, 3), 15),
      allDay: false,
      category: 'health' as const,
      color: '#f59e0b',
      location: "Medical Center"
    },
    {
      title: "Weekend Hiking",
      description: "Nature trail with friends",
      start: addHours(addDays(now, 5), 8),
      end: addHours(addDays(now, 5), 16),
      allDay: false,
      category: 'personal' as const,
      color: '#10b981',
      location: "Mountain Trail"
    },
    {
      title: "Project Deadline",
      description: "Submit final project deliverables",
      start: addDays(now, 7),
      end: addDays(now, 7),
      allDay: true,
      category: 'work' as const,
      color: '#dc2626'
    },
    {
      title: "Family Dinner",
      description: "Monthly family gathering",
      start: addHours(addDays(now, 6), 18),
      end: addHours(addDays(now, 6), 21),
      allDay: false,
      category: 'social' as const,
      color: '#8b5cf6',
      location: "Parents' House"
    }
  ];

  // Sample Reminders
  const sampleReminders = [
    {
      title: "Drink water",
      description: "Stay hydrated throughout the day",
      scheduledTime: addMinutes(now, 30),
      priority: 'medium' as const,
      category: 'health',
      notificationMethod: 'all' as const,
      repeat: {
        type: 'hours' as const,
        interval: 2
      }
    },
    {
      title: "Take a break",
      description: "Step away from screen for 5 minutes",
      scheduledTime: addMinutes(now, 45),
      priority: 'medium' as const,
      category: 'health',
      notificationMethod: 'popup' as const,
      repeat: {
        type: 'minutes' as const,
        interval: 45
      }
    },
    {
      title: "Review daily goals",
      description: "Check progress on today's objectives",
      scheduledTime: addHours(now, 4),
      priority: 'low' as const,
      category: 'productivity',
      notificationMethod: 'voice' as const
    },
    {
      title: "Prepare for tomorrow",
      description: "Plan tomorrow's tasks and priorities",
      scheduledTime: addHours(addDays(now, 1), -2), // 2 hours before end of day
      priority: 'medium' as const,
      category: 'planning',
      notificationMethod: 'all' as const,
      repeat: {
        type: 'daily' as const,
        interval: 1
      }
    },
    {
      title: "Weekly reflection",
      description: "Reflect on the week's accomplishments",
      scheduledTime: addDays(now, 4), // Friday
      priority: 'low' as const,
      category: 'personal',
      notificationMethod: 'popup' as const,
      repeat: {
        type: 'weekly' as const,
        interval: 1
      }
    }
  ];

  // Create sample data
  console.log('Initializing ChronoMate with sample data...');

  // Create tasks
  sampleTasks.forEach(task => {
    dataService.createTask(task);
  });

  // Create events
  sampleEvents.forEach(event => {
    dataService.createEvent(event);
  });

  // Create reminders
  sampleReminders.forEach(reminder => {
    dataService.createReminder(reminder);
  });

  // Set initial user preferences
  const userData = dataService.getUserData();
  dataService.updateUserData({
    ...userData,
    name: 'Demo User',
    preferences: {
      ...userData.preferences,
      notifications: true,
      voice: true,
      reminderTone: 'friendly'
    },
    habits: [
      {
        id: '1',
        name: 'Morning meditation',
        frequency: 'daily',
        streak: 5
      },
      {
        id: '2',
        name: 'Read for 30 minutes',
        frequency: 'daily',
        streak: 3
      },
      {
        id: '3',
        name: 'Exercise',
        frequency: 'daily',
        streak: 7
      },
      {
        id: '4',
        name: 'Weekly review',
        frequency: 'weekly',
        streak: 2
      }
    ],
    mood: {
      current: 'happy',
      history: [
        { date: new Date(), mood: 'happy', notes: 'Feeling productive today!' },
        { date: addDays(new Date(), -1), mood: 'neutral', notes: 'Regular day' },
        { date: addDays(new Date(), -2), mood: 'stressed', notes: 'Busy with deadlines' }
      ]
    }
  });

  console.log('Sample data initialized successfully!');
};

// Initialize sample data when module is imported
// This will only run once due to the check in the function
export const setupDemo = () => {
  // Add a small delay to ensure services are ready
  setTimeout(() => {
    initializeSampleData();
  }, 1000);
};