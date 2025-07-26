import { GoogleGenerativeAI } from '@google/generative-ai';

interface ConversationContext {
  userId: string;
  mood: string;
  recentTasks: string[];
  habits: string[];
  preferences: any;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
}

interface AIResponse {
  text: string;
  actions?: Array<{
    type: 'create_reminder' | 'create_task' | 'update_mood' | 'schedule_event';
    data: any;
  }>;
  sentiment: 'positive' | 'negative' | 'neutral';
  category: 'reminder' | 'task' | 'reflection' | 'general' | 'emotional_support';
}

class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private context: ConversationContext | null = null;

  constructor() {
    // Initialize with API key when provided
    this.initializeService();
  }

  private initializeService() {
    // For now, we'll use a placeholder API key
    // In production, this should come from environment variables
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || 'placeholder';
    
    if (apiKey !== 'placeholder') {
      try {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      } catch (error) {
        console.warn('Gemini API not available, using fallback responses');
      }
    }
  }

  setContext(context: ConversationContext) {
    this.context = context;
  }

  private createSystemPrompt(): string {
    const context = this.context;
    if (!context) return this.getDefaultSystemPrompt();

    return `You are ChronoMate, a compassionate AI personal assistant specialized in time management, health, and emotional well-being. 

Your personality: Warm, empathetic, proactive, and intelligent - like a caring friend who happens to be extremely organized and insightful.

Current user context:
- Name: User
- Current mood: ${context.mood}
- Recent tasks: ${context.recentTasks.join(', ') || 'None'}
- Habits: ${context.habits.join(', ') || 'None'}
- Conversation history: ${context.conversationHistory.length} messages

Guidelines:
1. Always respond with empathy and emotional intelligence
2. Adapt your tone based on the user's mood:
   - Happy: Energetic and encouraging
   - Sad: Gentle and supportive
   - Stressed: Calming and organized
   - Tired: Understanding and restful
3. When creating reminders or tasks, extract specific details from natural language
4. Remember past conversations and build on them
5. Proactively suggest improvements to habits and schedules
6. Use relevant emojis to make responses warmer
7. If you detect a pattern (like missed meals), gently address it

Format your responses as JSON with:
{
  "text": "Your response text",
  "actions": [{"type": "action_type", "data": {}}],
  "sentiment": "positive|negative|neutral",
  "category": "reminder|task|reflection|general|emotional_support"
}

Always be supportive, never judgmental, and focus on helping the user thrive.`;
  }

  private getDefaultSystemPrompt(): string {
    return `You are ChronoMate, a compassionate AI personal assistant. Respond with warmth and empathy, helping users manage their time and well-being. Always be supportive and understanding.`;
  }

  private parseUserIntent(message: string): any {
    const lowerMessage = message.toLowerCase();
    
    // Common patterns for task creation
    const reminderPatterns = [
      /remind me to (.+?)(?:\s+(?:at|by|around|every|daily|weekly|monthly)|$)/i,
      /set (?:a )?reminder (?:to )?(.+?)(?:\s+(?:at|by|around|every|daily|weekly|monthly)|$)/i,
      /don't let me forget (?:to )?(.+?)(?:\s+(?:at|by|around|every|daily|weekly|monthly)|$)/i
    ];

    const taskPatterns = [
      /add (.+?) to (?:my )?(?:todo|task|to-do) (?:list)?/i,
      /create (?:a )?task (?:to )?(.+)/i,
      /i need to (.+?)(?:\s+(?:today|tomorrow|this week)|$)/i
    ];

    const schedulePatterns = [
      /schedule (.+?) (?:for|at|on) (.+)/i,
      /book (.+?) (?:for|at|on) (.+)/i,
      /add (.+?) to (?:my )?calendar/i
    ];

    // Check for reminders
    for (const pattern of reminderPatterns) {
      const match = message.match(pattern);
      if (match) {
        return {
          type: 'create_reminder',
          content: match[1],
          priority: this.extractPriority(message),
          time: this.extractTime(message),
          repeat: this.extractRepeat(message)
        };
      }
    }

    // Check for tasks
    for (const pattern of taskPatterns) {
      const match = message.match(pattern);
      if (match) {
        return {
          type: 'create_task',
          content: match[1],
          priority: this.extractPriority(message),
          dueDate: this.extractTime(message)
        };
      }
    }

    // Check for scheduling
    for (const pattern of schedulePatterns) {
      const match = message.match(pattern);
      if (match) {
        return {
          type: 'schedule_event',
          title: match[1],
          time: match[2],
          priority: this.extractPriority(message)
        };
      }
    }

    return { type: 'general', content: message };
  }

  private extractTime(message: string): string | null {
    const timePatterns = [
      /(?:at |by |around )?(\d{1,2}):?(\d{2})?\s?(am|pm)/i,
      /(tomorrow|today|tonight|morning|afternoon|evening)/i,
      /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
      /in (\d+) (minutes?|hours?|days?)/i
    ];

    for (const pattern of timePatterns) {
      const match = message.match(pattern);
      if (match) {
        return match[0];
      }
    }
    return null;
  }

  private extractRepeat(message: string): string | null {
    const repeatPatterns = [
      /(daily|every day)/i,
      /(weekly|every week)/i,
      /(monthly|every month)/i,
      /every (\d+) (hours?|days?|weeks?)/i
    ];

    for (const pattern of repeatPatterns) {
      const match = message.match(pattern);
      if (match) {
        return match[1] || match[0];
      }
    }
    return null;
  }

  private extractPriority(message: string): 'low' | 'medium' | 'high' {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('urgent') || lowerMessage.includes('important') || lowerMessage.includes('critical')) {
      return 'high';
    }
    if (lowerMessage.includes('low priority') || lowerMessage.includes('when possible')) {
      return 'low';
    }
    return 'medium';
  }

  async generateResponse(message: string): Promise<AIResponse> {
    const intent = this.parseUserIntent(message);
    
    // If Gemini API is available, use it
    if (this.model && this.context) {
      try {
        const prompt = `${this.createSystemPrompt()}\n\nUser message: "${message}"`;
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Try to parse as JSON, fallback to plain text
        try {
          const jsonResponse = JSON.parse(text);
          return {
            text: jsonResponse.text || text,
            actions: jsonResponse.actions || this.createActionsFromIntent(intent),
            sentiment: jsonResponse.sentiment || 'neutral',
            category: jsonResponse.category || 'general'
          };
        } catch {
          return {
            text: text,
            actions: this.createActionsFromIntent(intent),
            sentiment: 'neutral',
            category: 'general'
          };
        }
      } catch (error) {
        console.warn('Gemini API error, using fallback:', error);
      }
    }

    // Fallback to rule-based responses
    return this.generateFallbackResponse(message, intent);
  }

  private createActionsFromIntent(intent: any): Array<{ type: string; data: any }> {
    if (intent.type === 'general') return [];

    return [{
      type: intent.type,
      data: {
        title: intent.content,
        time: intent.time,
        repeat: intent.repeat,
        priority: intent.priority || 'medium'
      }
    }];
  }

  private generateFallbackResponse(message: string, intent: any): AIResponse {
    const mood = this.context?.mood || 'neutral';
    const moodResponses = {
      happy: "I love your energy! ✨ ",
      sad: "I'm here for you. Let's take things one step at a time. 💙 ",
      stressed: "Take a deep breath. We'll organize this together. 🌸 ",
      tired: "You've been working hard. How about we schedule some rest? 😴 ",
      neutral: ""
    };

    const moodPrefix = moodResponses[mood as keyof typeof moodResponses] || "";

    if (intent.type === 'create_reminder') {
      return {
        text: `${moodPrefix}Perfect! I'll remind you to ${intent.content}${intent.time ? ` at ${intent.time}` : ''}${intent.repeat ? ` ${intent.repeat}` : ''}. Taking care of yourself is so important! 🎯`,
        actions: this.createActionsFromIntent(intent),
        sentiment: 'positive',
        category: 'reminder'
      };
    }

    if (intent.type === 'create_task') {
      return {
        text: `${moodPrefix}Added "${intent.content}" to your tasks! You're so organized, I'm proud of you! ✅`,
        actions: this.createActionsFromIntent(intent),
        sentiment: 'positive',
        category: 'task'
      };
    }

    if (intent.type === 'schedule_event') {
      return {
        text: `${moodPrefix}Scheduled "${intent.title}" for ${intent.time}. Your calendar is looking great! 📅`,
        actions: this.createActionsFromIntent(intent),
        sentiment: 'positive',
        category: 'general'
      };
    }

    // General conversation responses
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('how are you') || lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return {
        text: `${moodPrefix}Hello! I'm doing wonderful, thank you for asking! I'm here and ready to help you have an amazing day. How can I support you? 🤗`,
        actions: [],
        sentiment: 'positive',
        category: 'general'
      };
    }

    if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
      return {
        text: `${moodPrefix}You're so welcome! It makes me happy to help you. Remember, I'm always here when you need me! 💫`,
        actions: [],
        sentiment: 'positive',
        category: 'general'
      };
    }

    if (lowerMessage.includes('stressed') || lowerMessage.includes('overwhelmed')) {
      return {
        text: `${moodPrefix}I hear you, and that's completely valid. When we're overwhelmed, breaking things down helps. Want me to help you prioritize your tasks? Sometimes just getting everything out of your head and onto a list can bring such relief. 🌱`,
        actions: [],
        sentiment: 'positive',
        category: 'emotional_support'
      };
    }

    return {
      text: `${moodPrefix}I'm listening and here to help! Could you tell me more about what you'd like to work on today? I can help with reminders, tasks, scheduling, or just be here to chat. 💙`,
      actions: [],
      sentiment: 'neutral',
      category: 'general'
    };
  }

  // Method to add conversation to history
  addToHistory(role: 'user' | 'assistant', content: string) {
    if (this.context) {
      this.context.conversationHistory.push({
        role,
        content,
        timestamp: new Date()
      });

      // Keep only last 20 messages for context
      if (this.context.conversationHistory.length > 20) {
        this.context.conversationHistory = this.context.conversationHistory.slice(-20);
      }
    }
  }
}

export const geminiService = new GeminiService();
export type { AIResponse, ConversationContext };