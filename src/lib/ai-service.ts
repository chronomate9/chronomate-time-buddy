import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

export interface AIResponse {
  text: string;
  actions?: {
    type: 'reminder' | 'task' | 'calendar' | 'mood' | 'goal';
    data: any;
  }[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  suggestions?: string[];
}

export interface ConversationContext {
  userProfile: any;
  recentMessages: string[];
  currentMood: string;
  activeTasks: any[];
  habits: any;
  goals: any[];
}

export class ChronoMateAI {
  private model: any;
  private conversationHistory: string[] = [];
  private context: ConversationContext | null = null;

  constructor() {
    this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async initialize(context: ConversationContext) {
    this.context = context;
    
    // Set up the AI personality and context
    const systemPrompt = this.buildSystemPrompt(context);
    
    try {
      const result = await this.model.generateContent(systemPrompt);
      await result.response;
    } catch (error) {
      console.error('Error initializing AI:', error);
    }
  }

  private buildSystemPrompt(context: ConversationContext): string {
    return `You are ChronoMate, a compassionate, emotionally intelligent AI personal assistant designed to help users manage their time, health, and well-being. 

PERSONALITY:
- Warm, empathetic, and understanding
- Adapts tone based on user's mood and communication style
- Proactive in suggesting helpful actions
- Remembers user preferences and patterns
- Speaks like a caring friend, not a formal assistant

USER CONTEXT:
- Name: ${context.userProfile.name}
- Communication Style: ${context.userProfile.preferences.communicationStyle}
- Focus Areas: ${context.userProfile.preferences.focusAreas.join(', ')}
- Preferred Times: ${context.userProfile.preferences.preferredTimes.join(', ')}
- Current Mood: ${context.currentMood}
- Completed Tasks: ${context.userProfile.history.completedTasks}
- Active Goals: ${context.goals.length}
- Habit Streaks: ${Object.values(context.habits).reduce((max: number, habit: any) => Math.max(max, habit.streak || 0), 0)}

CAPABILITIES:
- Create reminders and tasks
- Schedule calendar events
- Track habits and goals
- Provide emotional support
- Suggest productivity improvements
- Remember conversation context

RESPONSE FORMAT:
Respond naturally and conversationally. If you need to perform actions, include them in your response like this:
[ACTION:reminder:{"title":"Drink water","time":"14:00","repeat":"daily"}]
[ACTION:task:{"title":"Buy groceries","priority":"medium"}]
[ACTION:calendar:{"title":"Team meeting","date":"2024-01-15","time":"10:00"}]

Always be supportive, understanding, and helpful. Adapt your tone to match the user's mood and communication style.`;
  }

  async processMessage(userMessage: string): Promise<AIResponse> {
    if (!this.context) {
      throw new Error('AI not initialized');
    }

    // Add user message to conversation history
    this.conversationHistory.push(`User: ${userMessage}`);
    
    // Keep only last 10 messages for context
    if (this.conversationHistory.length > 10) {
      this.conversationHistory = this.conversationHistory.slice(-10);
    }

    try {
      const prompt = `${this.buildSystemPrompt(this.context)}

Recent conversation:
${this.conversationHistory.join('\n')}

Current user message: ${userMessage}

Respond as ChronoMate, being empathetic and helpful. If you need to perform any actions, include them in your response using the [ACTION:type:data] format.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse actions from response
      const actions = this.parseActions(text);
      const cleanText = this.removeActionMarkers(text);

      // Add AI response to conversation history
      this.conversationHistory.push(`ChronoMate: ${cleanText}`);

      return {
        text: cleanText,
        actions,
        sentiment: this.analyzeSentiment(cleanText),
        suggestions: this.generateSuggestions(userMessage, cleanText)
      };
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Fallback response
      return {
        text: "I'm having trouble processing that right now. Could you try rephrasing? I'm here to help! 🤗",
        sentiment: 'neutral'
      };
    }
  }

  private parseActions(text: string): AIResponse['actions'] {
    const actionRegex = /\[ACTION:(\w+):({[^}]+})\]/g;
    const actions: AIResponse['actions'] = [];
    
    let match;
    while ((match = actionRegex.exec(text)) !== null) {
      try {
        const type = match[1] as any;
        const data = JSON.parse(match[2]);
        actions.push({ type, data });
      } catch (error) {
        console.error('Error parsing action:', error);
      }
    }
    
    return actions;
  }

  private removeActionMarkers(text: string): string {
    return text.replace(/\[ACTION:\w+:\{[^}]+\}\]/g, '').trim();
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['great', 'awesome', 'excellent', 'wonderful', 'amazing', 'love', 'happy', 'excited'];
    const negativeWords = ['sad', 'angry', 'frustrated', 'tired', 'stressed', 'worried', 'anxious'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private generateSuggestions(userMessage: string, aiResponse: string): string[] {
    const suggestions: string[] = [];
    const lowerMessage = userMessage.toLowerCase();
    
    // Context-based suggestions
    if (lowerMessage.includes('tired') || lowerMessage.includes('exhausted')) {
      suggestions.push('Schedule a rest break');
      suggestions.push('Take a short walk');
      suggestions.push('Practice deep breathing');
    }
    
    if (lowerMessage.includes('stressed') || lowerMessage.includes('overwhelmed')) {
      suggestions.push('Break tasks into smaller steps');
      suggestions.push('Schedule some downtime');
      suggestions.push('Try a quick meditation');
    }
    
    if (lowerMessage.includes('productive') || lowerMessage.includes('focus')) {
      suggestions.push('Schedule important tasks for peak hours');
      suggestions.push('Set specific time blocks');
      suggestions.push('Review your goals');
    }
    
    // Default suggestions
    if (suggestions.length === 0) {
      suggestions.push('How are you feeling today?');
      suggestions.push('What would you like to accomplish?');
      suggestions.push('Need help with your schedule?');
    }
    
    return suggestions.slice(0, 3);
  }

  async generateDailyInsights(): Promise<string> {
    if (!this.context) return '';
    
    try {
      const prompt = `Based on this user's profile and recent activity, provide a brief, encouraging daily insight:

User Profile: ${JSON.stringify(this.context.userProfile)}
Recent Activity: ${this.context.recentMessages.slice(-3).join(', ')}
Current Mood: ${this.context.currentMood}

Provide a warm, personalized insight that encourages and motivates. Keep it under 100 words.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating daily insights:', error);
      return "Today is a new opportunity to make progress on your goals. I'm here to support you every step of the way! 🌟";
    }
  }

  async suggestScheduleOptimization(): Promise<string[]> {
    if (!this.context) return [];
    
    try {
      const prompt = `Based on this user's preferences and habits, suggest 3 schedule optimizations:

Preferences: ${JSON.stringify(this.context.userProfile.preferences)}
Habits: ${JSON.stringify(this.context.habits)}
Goals: ${JSON.stringify(this.context.goals)}

Provide 3 specific, actionable suggestions for optimizing their daily schedule.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse suggestions (assuming they're numbered or bulleted)
      return text.split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => line.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, ''))
        .slice(0, 3);
    } catch (error) {
      console.error('Error generating schedule suggestions:', error);
      return [
        'Schedule important tasks during your peak energy hours',
        'Include short breaks between focused work sessions',
        'Plan your most challenging tasks for when you feel most alert'
      ];
    }
  }
}

// Export singleton instance
export const chronoMateAI = new ChronoMateAI();