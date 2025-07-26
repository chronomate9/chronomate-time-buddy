import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Calendar as CalendarIcon, 
  CheckSquare, 
  Settings, 
  Moon, 
  Sun,
  Sparkles,
  Heart,
  Target,
  TrendingUp
} from 'lucide-react';
import { EnhancedAIAssistant } from '@/components/EnhancedAIAssistant';
import { InteractiveCalendar } from '@/components/InteractiveCalendar';
import { SmartTodoList } from '@/components/SmartTodoList';
import { MoodSlider } from '@/components/MoodSlider';
import { Analytics } from '@/components/Analytics';
import { FloatingAssistant } from '@/components/FloatingAssistant';
import { SuccessAnimation } from '@/components/SuccessAnimation';
import { dataService } from '@/services/dataService';
import { notificationService } from '@/services/notificationService';
import { setupDemo } from '@/services/sampleData';
import { toast } from 'sonner';

const EnhancedIndex = () => {
  const [currentMood, setCurrentMood] = useState('neutral');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState({
    message: '',
    type: 'completion' as const
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userData, setUserData] = useState(dataService.getUserData());
  const [insights, setInsights] = useState(dataService.getProductivityInsights());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Update insights when data changes
  useEffect(() => {
    const interval = setInterval(() => {
      setInsights(dataService.getProductivityInsights());
    }, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Initialize app on mount
  useEffect(() => {
    // Request notification permission
    dataService.requestNotificationPermission();
    
    // Initialize notification service
    notificationService.requestPermission();
    
    // Setup demo data
    setupDemo();
    
    // Welcome message
    setTimeout(() => {
      toast.success('Welcome to ChronoMate AI! 🚀', {
        description: 'Your intelligent personal assistant is ready to help you thrive!'
      });
    }, 2000);
  }, []);

  const handleTaskCreated = (task: any) => {
    setSuccessData({
      message: `Task "${task.title}" created successfully! 🎯`,
      type: 'completion'
    });
    setShowSuccess(true);
    setInsights(dataService.getProductivityInsights());
  };

  const handleEventCreated = (event: any) => {
    setSuccessData({
      message: `Event "${event.title}" scheduled! 📅`,
      type: 'completion'
    });
    setShowSuccess(true);
  };

  const handleReminderCreated = (reminder: any) => {
    setSuccessData({
      message: `Reminder set: "${reminder.title}" 🔔`,
      type: 'completion'
    });
    setShowSuccess(true);
  };

  const handleMoodChange = (mood: string) => {
    setCurrentMood(mood);
    dataService.updateMood(mood);
    setUserData(dataService.getUserData());
  };

  const getTimeBasedGreeting = () => {
    const hour = currentTime.getHours();
    let greeting;
    let emoji;
    
    if (hour < 6) {
      greeting = "Working late?";
      emoji = "🌙";
    } else if (hour < 12) {
      greeting = "Good morning";
      emoji = "🌅";
    } else if (hour < 17) {
      greeting = "Good afternoon";
      emoji = "☀️";
    } else if (hour < 21) {
      greeting = "Good evening";
      emoji = "🌆";
    } else {
      greeting = "Good night";
      emoji = "🌙";
    }
    
    return { greeting, emoji };
  };

  const { greeting, emoji } = getTimeBasedGreeting();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Enhanced Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-accent/3" />
        <motion.div 
          className="absolute top-20 left-20 w-96 h-96 bg-primary/8 rounded-full blur-3xl" 
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.1, 1]
          }} 
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }} 
        />
        <motion.div 
          className="absolute bottom-20 right-20 w-72 h-72 bg-accent/8 rounded-full blur-3xl" 
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
            scale: [1, 1.2, 1]
          }} 
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          }} 
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl" 
          animate={{
            x: [-100, 100, -100],
            y: [-50, 50, -50],
            rotate: [0, 360, 0]
          }} 
          transition={{
            duration: 40,
            repeat: Infinity,
            ease: "linear"
          }} 
        />
      </div>

      {/* Top Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/20"
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.h1 
                className="text-2xl font-bold gradient-text"
                whileHover={{ scale: 1.05 }}
              >
                ChronoMate
              </motion.h1>
              <Badge variant="outline" className="bg-primary/10">
                AI Powered
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-right"
              >
                <div className="text-sm font-medium flex items-center space-x-1">
                  <span>{emoji}</span>
                  <span>{greeting}!</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {currentTime.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </motion.div>
              
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="bg-green-500/10 text-green-700">
                  {insights.pendingTasks} pending
                </Badge>
                <Badge variant="outline" className="bg-blue-500/10 text-blue-700">
                  {insights.weeklyCompletionRate}% completed
                </Badge>
              </div>
              
              <Button variant="ghost" size="icon">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Dashboard Layout */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6 min-h-[calc(100vh-140px)]">
          
          {/* Left Panel - AI Assistant */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="col-span-12 lg:col-span-4 space-y-6"
          >
            <EnhancedAIAssistant
              mood={currentMood}
              onTaskCreated={handleTaskCreated}
              onEventCreated={handleEventCreated}
              onReminderCreated={handleReminderCreated}
            />
            
            {/* Mood Tracker */}
            <Card className="glass-strong p-4">
              <h3 className="font-semibold mb-3 flex items-center">
                <Heart className="w-4 h-4 mr-2 text-red-500" />
                How are you feeling?
              </h3>
              <MoodSlider onMoodChange={handleMoodChange} />
            </Card>

            {/* Quick Insights */}
            <Card className="glass-strong p-4">
              <h3 className="font-semibold mb-3 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-blue-500" />
                Today's Insights
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Completion Rate</span>
                  <Badge variant="outline">
                    {insights.weeklyCompletionRate}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Tasks</span>
                  <Badge variant="outline">
                    {insights.totalTasks}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Overdue</span>
                  <Badge variant="outline" className="bg-red-500/10 text-red-700">
                    {insights.overdueTasks}
                  </Badge>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Center Panel - Calendar */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="col-span-12 lg:col-span-5 space-y-6"
          >
            <InteractiveCalendar
              onEventCreated={handleEventCreated}
              onDateClick={(date) => {
                toast.info(`Selected ${date.toDateString()}`);
              }}
            />
            
            {/* Weekly Analytics */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Analytics />
            </motion.div>
          </motion.div>

          {/* Right Panel - Todo List & Habits */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="col-span-12 lg:col-span-3 space-y-6"
          >
            <SmartTodoList
              onTaskCreated={handleTaskCreated}
              onTaskUpdate={(task) => {
                if (task.completed) {
                  setSuccessData({
                    message: `Great job completing "${task.title}"! 🎉`,
                    type: 'completion'
                  });
                  setShowSuccess(true);
                }
                setInsights(dataService.getProductivityInsights());
              }}
            />

            {/* Quick Actions */}
            <Card className="glass-strong p-4">
              <h3 className="font-semibold mb-3 flex items-center">
                <Sparkles className="w-4 h-4 mr-2 text-purple-500" />
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    const task = dataService.createTask({
                      title: "Take a 5-minute break",
                      priority: 'medium',
                      category: 'health',
                      tags: []
                    });
                    handleTaskCreated(task);
                  }}
                >
                  <Target className="w-3 h-3 mr-1" />
                  Break
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    const reminder = dataService.createReminder({
                      title: "Drink water",
                      scheduledTime: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
                      priority: 'medium',
                      category: 'health',
                      notificationMethod: 'all'
                    });
                    handleReminderCreated(reminder);
                  }}
                >
                  💧 Water
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    const event = dataService.createEvent({
                      title: "Focus Session",
                      start: new Date(),
                      end: new Date(Date.now() + 25 * 60 * 1000), // 25 minutes
                      allDay: false,
                      category: 'work',
                      color: '#3b82f6'
                    });
                    handleEventCreated(event);
                  }}
                >
                  🎯 Focus
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    const task = dataService.createTask({
                      title: "Daily reflection",
                      priority: 'low',
                      category: 'personal',
                      tags: ['reflection']
                    });
                    handleTaskCreated(task);
                  }}
                >
                  💭 Reflect
                </Button>
              </div>
            </Card>

            {/* Current Mood Display */}
            {currentMood !== 'neutral' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center p-4 bg-primary/5 rounded-xl border border-primary/20"
              >
                <div className="text-2xl mb-1">
                  {currentMood === 'happy' ? '😊' : 
                   currentMood === 'sad' ? '😢' : 
                   currentMood === 'stressed' ? '😰' : 
                   currentMood === 'tired' ? '😴' : '😐'}
                </div>
                <p className="text-sm text-muted-foreground">
                  You're feeling {currentMood} today
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Enhanced Floating Assistant */}
      <FloatingAssistant />

      {/* Success Animation */}
      <SuccessAnimation 
        show={showSuccess} 
        onComplete={() => setShowSuccess(false)} 
        message={successData.message} 
        type={successData.type} 
      />

      {/* Bottom Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-4 left-4 right-4 z-30"
      >
        <Card className="glass-strong p-3 mx-auto max-w-4xl">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-4">
              <span>🎯 {insights.pendingTasks} tasks left</span>
              <span>📈 {insights.weeklyCompletionRate}% completion rate</span>
              <span>🔥 Keep up the great work!</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                ChronoMate AI v2.0
              </Badge>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default EnhancedIndex;