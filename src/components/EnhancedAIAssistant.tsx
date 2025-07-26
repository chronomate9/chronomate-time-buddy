import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Send, Volume2, Settings, Brain, Sparkles, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useSpeechSynthesis, useSpeechRecognition } from 'react-speech-kit';
import { toast } from 'sonner';
import { geminiService, type AIResponse, type ConversationContext } from '@/services/geminiService';
import { dataService } from '@/services/dataService';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  sentiment?: 'positive' | 'negative' | 'neutral';
  category?: 'reminder' | 'task' | 'reflection' | 'general' | 'emotional_support';
  actions?: Array<{
    type: string;
    data: any;
  }>;
}

interface EnhancedAIAssistantProps {
  mood?: string;
  onTaskCreated?: (task: any) => void;
  onEventCreated?: (event: any) => void;
  onReminderCreated?: (reminder: any) => void;
  className?: string;
}

export const EnhancedAIAssistant: React.FC<EnhancedAIAssistantProps> = ({
  mood = "neutral",
  onTaskCreated,
  onEventCreated,
  onReminderCreated,
  className = ""
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [assistantMood, setAssistantMood] = useState<'happy' | 'calm' | 'excited' | 'thoughtful'>('calm');

  const { speak, voices, speaking } = useSpeechSynthesis();
  const { listen, listening, stop } = useSpeechRecognition({
    onResult: (result: string) => {
      setInputValue(result);
    },
  });

  // Initialize conversation context
  useEffect(() => {
    const userData = dataService.getUserData();
    const context: ConversationContext = {
      userId: userData.id,
      mood: mood,
      recentTasks: dataService.getTasks({ completed: false }).slice(0, 5).map(t => t.title),
      habits: userData.habits.map(h => h.name),
      preferences: userData.preferences,
      conversationHistory: []
    };
    
    geminiService.setContext(context);

    // Initial greeting
    const greeting = getTimeBasedGreeting();
    setMessages([{
      id: '1',
      text: greeting,
      isBot: true,
      timestamp: new Date(),
      sentiment: 'positive',
      category: 'general'
    }]);
  }, [mood]);

  const getTimeBasedGreeting = (): string => {
    const hour = new Date().getHours();
    const userData = dataService.getUserData();
    const insights = dataService.getProductivityInsights();
    
    let timeGreeting;
    if (hour < 12) {
      timeGreeting = "Good morning";
      setAssistantMood('excited');
    } else if (hour < 17) {
      timeGreeting = "Good afternoon";
      setAssistantMood('calm');
    } else {
      timeGreeting = "Good evening";
      setAssistantMood('thoughtful');
    }

    const moodEmoji = mood === 'happy' ? '😊' : mood === 'sad' ? '💙' : mood === 'stressed' ? '🌸' : mood === 'tired' ? '😴' : '🤗';

    return `${timeGreeting}! ${moodEmoji} I'm ChronoMate, your intelligent personal assistant. I see you have ${insights.pendingTasks} pending tasks today. I'm here to help you thrive - whether you need reminders, want to chat, or need help organizing your day. How can I support you right now?`;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const processAIActions = useCallback((actions: any[]) => {
    actions.forEach(action => {
      switch (action.type) {
        case 'create_reminder':
          const reminderTime = action.data.time ? 
            parseTimeString(action.data.time) : 
            new Date(Date.now() + 60000); // Default to 1 minute from now

          const reminder = dataService.createReminder({
            title: action.data.title,
            description: action.data.description,
            scheduledTime: reminderTime,
            priority: action.data.priority || 'medium',
            category: action.data.category || 'general',
            notificationMethod: 'all'
          });
          
          onReminderCreated?.(reminder);
          toast.success('Reminder created!', {
            description: `"${reminder.title}" scheduled for ${reminderTime.toLocaleTimeString()}`
          });
          break;

        case 'create_task':
          const task = dataService.createTask({
            title: action.data.title,
            description: action.data.description,
            priority: action.data.priority || 'medium',
            category: action.data.category || 'general',
            dueDate: action.data.dueDate ? parseTimeString(action.data.dueDate) : undefined,
            tags: action.data.tags || []
          });
          
          onTaskCreated?.(task);
          toast.success('Task created!', {
            description: `"${task.title}" added to your tasks`
          });
          break;

        case 'schedule_event':
          const eventStart = parseTimeString(action.data.time);
          const eventEnd = new Date(eventStart.getTime() + 60 * 60 * 1000); // Default 1 hour
          
          const event = dataService.createEvent({
            title: action.data.title,
            description: action.data.description,
            start: eventStart,
            end: eventEnd,
            allDay: false,
            category: action.data.category || 'personal',
            color: getCategoryColor(action.data.category || 'personal')
          });
          
          onEventCreated?.(event);
          toast.success('Event scheduled!', {
            description: `"${event.title}" added to calendar`
          });
          break;

        case 'update_mood':
          dataService.updateMood(action.data.mood, action.data.notes);
          break;
      }
    });
  }, [onTaskCreated, onEventCreated, onReminderCreated]);

  const parseTimeString = (timeStr: string): Date => {
    const now = new Date();
    
    // Handle relative times
    if (timeStr.includes('minutes')) {
      const minutes = parseInt(timeStr.match(/\d+/)?.[0] || '5');
      return new Date(now.getTime() + minutes * 60000);
    }
    
    if (timeStr.includes('hours')) {
      const hours = parseInt(timeStr.match(/\d+/)?.[0] || '1');
      return new Date(now.getTime() + hours * 3600000);
    }
    
    if (timeStr.includes('tomorrow')) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0); // Default to 9 AM
      return tomorrow;
    }
    
    // Handle time formats like "2 PM", "14:30"
    const timeMatch = timeStr.match(/(\d{1,2}):?(\d{2})?\s?(am|pm)?/i);
    if (timeMatch) {
      const hour = parseInt(timeMatch[1]);
      const minute = parseInt(timeMatch[2] || '0');
      const ampm = timeMatch[3]?.toLowerCase();
      
      const scheduleDate = new Date(now);
      let finalHour = hour;
      
      if (ampm === 'pm' && hour !== 12) {
        finalHour += 12;
      } else if (ampm === 'am' && hour === 12) {
        finalHour = 0;
      }
      
      scheduleDate.setHours(finalHour, minute, 0, 0);
      
      // If the time has passed today, schedule for tomorrow
      if (scheduleDate <= now) {
        scheduleDate.setDate(scheduleDate.getDate() + 1);
      }
      
      return scheduleDate;
    }
    
    // Default fallback
    return new Date(now.getTime() + 60000);
  };

  const getCategoryColor = (category: string): string => {
    const colors = {
      work: '#3b82f6',
      personal: '#10b981',
      health: '#f59e0b',
      social: '#8b5cf6',
      other: '#6b7280'
    };
    return colors[category as keyof typeof colors] || colors.other;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = inputValue;
    setInputValue('');
    setIsTyping(true);
    setIsThinking(true);

    // Add to Gemini conversation history
    geminiService.addToHistory('user', messageText);

    try {
      // Get AI response
      const aiResponse: AIResponse = await geminiService.generateResponse(messageText);
      
      // Update assistant mood based on response
      if (aiResponse.sentiment === 'positive') {
        setAssistantMood('happy');
      } else if (aiResponse.category === 'emotional_support') {
        setAssistantMood('thoughtful');
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse.text,
        isBot: true,
        timestamp: new Date(),
        sentiment: aiResponse.sentiment,
        category: aiResponse.category,
        actions: aiResponse.actions
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
      setIsThinking(false);

      // Process any actions
      if (aiResponse.actions && aiResponse.actions.length > 0) {
        processAIActions(aiResponse.actions);
      }

      // Add to conversation history
      geminiService.addToHistory('assistant', aiResponse.text);

      // Speak the response with appropriate voice
      if (voices.length > 0) {
        const preferredVoice = voices.find(voice => 
          voice.name.toLowerCase().includes('female') || 
          voice.name.toLowerCase().includes('samantha') ||
          voice.name.toLowerCase().includes('zira')
        ) || voices[0];
        
        // Adjust speech rate based on content length and mood
        const rate = aiResponse.text.length > 100 ? 0.9 : 1.0;
        speak({ 
          text: aiResponse.text.replace(/[🌟💙🎯✅📅🤗💫🌱😊😴🌸✨]/g, ''), // Remove emojis for speech
          voice: preferredVoice,
          rate
        });
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm having a moment of reflection. Could you try again? I'm here and ready to help! 💙",
        isBot: true,
        timestamp: new Date(),
        sentiment: 'neutral',
        category: 'general'
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setIsTyping(false);
      setIsThinking(false);
    }
  };

  const toggleListening = () => {
    if (listening) {
      stop();
    } else {
      listen();
    }
  };

  const getAssistantAvatar = () => {
    const avatars = {
      happy: '😊',
      calm: '🤗',
      excited: '✨',
      thoughtful: '💭'
    };
    return avatars[assistantMood];
  };

  const samplePrompts = [
    "Remind me to drink water in 2 hours",
    "Add groceries to my tasks",
    "Schedule a team meeting tomorrow at 2 PM",
    "I'm feeling overwhelmed today",
    "Help me plan my evening",
    "What did I accomplish this week?"
  ];

  return (
    <div className={`w-full ${className}`}>
      {/* AI Assistant Header */}
      <Card className="glass-strong p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <motion.div
              animate={{ 
                scale: isThinking ? [1, 1.1, 1] : 1,
                rotate: isThinking ? [0, 5, -5, 0] : 0
              }}
              transition={{ 
                duration: isThinking ? 1 : 0,
                repeat: isThinking ? Infinity : 0
              }}
              className="text-3xl"
            >
              {getAssistantAvatar()}
            </motion.div>
            <div>
              <h3 className="font-semibold text-lg">ChronoMate AI</h3>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isThinking ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
                <span className="text-sm text-muted-foreground">
                  {isThinking ? 'Thinking...' : 'Ready to help'}
                </span>
                {isThinking && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Brain className="w-4 h-4 text-primary" />
                  </motion.div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-primary/10">
              {mood} mood
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowProfile(!showProfile)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="h-96 overflow-y-auto mb-4 space-y-4 bg-muted/20 rounded-lg p-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`flex items-start space-x-2 max-w-[85%] ${message.isBot ? '' : 'flex-row-reverse space-x-reverse'}`}>
                  {message.isBot && (
                    <div className="text-xl">
                      {getAssistantAvatar()}
                    </div>
                  )}
                  <div
                    className={`p-3 rounded-2xl relative ${
                      message.isBot
                        ? 'bg-secondary/80 text-secondary-foreground border border-border/50'
                        : 'bg-primary/90 text-primary-foreground'
                    }`}
                  >
                    <div className="text-sm leading-relaxed">
                      {message.text}
                    </div>
                    {message.sentiment && message.isBot && (
                      <div className="flex items-center space-x-1 mt-2">
                        {message.sentiment === 'positive' && <Heart className="w-3 h-3 text-red-400" />}
                        {message.category && (
                          <Badge variant="secondary" className="text-xs">
                            {message.category}
                          </Badge>
                        )}
                      </div>
                    )}
                    <div className="text-xs opacity-60 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex items-center space-x-2">
                <div className="text-xl">{getAssistantAvatar()}</div>
                <div className="bg-secondary/80 p-3 rounded-2xl">
                  <div className="flex space-x-1">
                    <motion.div 
                      className="w-2 h-2 bg-primary rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                    />
                    <motion.div 
                      className="w-2 h-2 bg-primary rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                    />
                    <motion.div 
                      className="w-2 h-2 bg-primary rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask me anything... I'm here to help! 💙"
                className="w-full p-3 pr-12 rounded-xl bg-muted/50 border border-border focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                disabled={isTyping}
              />
              {inputValue && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                </motion.div>
              )}
            </div>
            
            <Button
              onClick={toggleListening}
              variant={listening ? "destructive" : "secondary"}
              size="icon"
              className="h-12 w-12 rounded-xl"
              disabled={isTyping}
            >
              {listening ? <MicOff /> : <Mic />}
            </Button>
            
            <Button
              onClick={handleSendMessage}
              className="h-12 w-12 rounded-xl bg-primary hover:bg-primary/80"
              size="icon"
              disabled={isTyping || !inputValue.trim()}
            >
              <Send />
            </Button>
          </div>

          {listening && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center text-sm text-primary animate-pulse flex items-center justify-center space-x-2"
            >
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
              <span>🎤 Listening... Speak naturally!</span>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            </motion.div>
          )}
        </div>
      </Card>

      {/* Quick Action Prompts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {samplePrompts.map((prompt, index) => (
          <motion.button
            key={index}
            onClick={() => setInputValue(prompt)}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="p-3 text-sm bg-muted/30 hover:bg-muted/50 rounded-xl border border-border/50 hover:border-primary/50 transition-all duration-200 text-left group"
            disabled={isTyping}
          >
            <div className="flex items-center justify-between">
              <span>{prompt}</span>
              <Sparkles className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};