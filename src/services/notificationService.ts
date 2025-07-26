import { toast } from 'sonner';

interface NotificationOptions {
  title: string;
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
}

class NotificationService {
  private permission: NotificationPermission = 'default';

  constructor() {
    this.checkPermission();
    this.setupNotificationListener();
  }

  private checkPermission() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    if (this.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    }

    return false;
  }

  async showNotification(options: NotificationOptions): Promise<void> {
    // Check if we have permission
    const hasPermission = await this.requestPermission();

    if (hasPermission) {
      // Show browser notification
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        badge: options.badge || '/favicon.ico',
        tag: options.tag,
        data: options.data
      });

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Handle click
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }

    // Always show in-app notification as fallback
    this.showInAppNotification(options);
  }

  private showInAppNotification(options: NotificationOptions): void {
    toast(options.title, {
      description: options.body,
      duration: 5000,
      action: options.data?.action ? {
        label: options.data.action.label,
        onClick: options.data.action.onClick
      } : undefined
    });
  }

  showReminderNotification(title: string, description?: string): void {
    this.showNotification({
      title: `🔔 Reminder: ${title}`,
      body: description,
      tag: 'reminder',
      data: {
        type: 'reminder',
        action: {
          label: 'Mark as Done',
          onClick: () => {
            toast.success('Reminder marked as completed!');
          }
        }
      }
    });
  }

  showTaskCompletionNotification(taskTitle: string): void {
    this.showNotification({
      title: `🎉 Task Completed!`,
      body: `Great job completing "${taskTitle}"`,
      tag: 'task-completion',
      data: {
        type: 'task-completion'
      }
    });
  }

  showStreakNotification(streakCount: number): void {
    this.showNotification({
      title: `🔥 ${streakCount} Day Streak!`,
      body: `You're on fire! Keep up the amazing work!`,
      tag: 'streak',
      data: {
        type: 'streak'
      }
    });
  }

  showWaterReminder(): void {
    this.showNotification({
      title: `💧 Time to Hydrate!`,
      body: `Remember to drink some water. Your body will thank you!`,
      tag: 'water-reminder',
      data: {
        type: 'health',
        action: {
          label: 'Done',
          onClick: () => {
            toast.success('Stay hydrated! 💧');
          }
        }
      }
    });
  }

  showBreakReminder(): void {
    this.showNotification({
      title: `⏰ Break Time!`,
      body: `You've been working hard. Time for a quick break!`,
      tag: 'break-reminder',
      data: {
        type: 'break',
        action: {
          label: 'Taking a break',
          onClick: () => {
            toast.success('Enjoy your break! 😌');
          }
        }
      }
    });
  }

  showMoodCheckIn(): void {
    this.showNotification({
      title: `💝 How are you feeling?`,
      body: `Take a moment to check in with yourself`,
      tag: 'mood-checkin',
      data: {
        type: 'mood'
      }
    });
  }

  private setupNotificationListener(): void {
    // Listen for custom events from the data service
    window.addEventListener('chronomate-reminder', (event: any) => {
      const reminder = event.detail;
      this.showReminderNotification(reminder.title, reminder.description);
    });

    // Setup periodic health reminders
    this.setupHealthReminders();
  }

  private setupHealthReminders(): void {
    // Water reminder every 2 hours during work hours (9 AM - 6 PM)
    setInterval(() => {
      const hour = new Date().getHours();
      if (hour >= 9 && hour <= 18) {
        this.showWaterReminder();
      }
    }, 2 * 60 * 60 * 1000); // 2 hours

    // Break reminder every 45 minutes during work hours
    setInterval(() => {
      const hour = new Date().getHours();
      if (hour >= 9 && hour <= 18) {
        this.showBreakReminder();
      }
    }, 45 * 60 * 1000); // 45 minutes

    // Mood check-in reminder twice a day
    const moodCheckTimes = [10, 15]; // 10 AM and 3 PM
    setInterval(() => {
      const hour = new Date().getHours();
      if (moodCheckTimes.includes(hour)) {
        this.showMoodCheckIn();
      }
    }, 60 * 60 * 1000); // Check every hour
  }

  // Voice notifications
  speak(text: string, options?: { rate?: number; pitch?: number; volume?: number }): void {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      
      if (options) {
        utterance.rate = options.rate || 1;
        utterance.pitch = options.pitch || 1;
        utterance.volume = options.volume || 1;
      }

      // Try to find a female voice
      const voices = speechSynthesis.getVoices();
      const femaleVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('female') ||
        voice.name.toLowerCase().includes('samantha') ||
        voice.name.toLowerCase().includes('zira') ||
        voice.name.toLowerCase().includes('karen')
      );

      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }

      speechSynthesis.speak(utterance);
    }
  }

  speakReminder(title: string): void {
    this.speak(`Reminder: ${title}`, { rate: 0.9 });
  }

  speakEncouragement(): void {
    const encouragements = [
      "You're doing great! Keep it up!",
      "Amazing progress today!",
      "You've got this!",
      "Way to stay productive!",
      "Fantastic work!"
    ];
    
    const message = encouragements[Math.floor(Math.random() * encouragements.length)];
    this.speak(message, { rate: 0.8, pitch: 1.1 });
  }
}

export const notificationService = new NotificationService();