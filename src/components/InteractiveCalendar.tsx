import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  MapPin, 
  Users,
  Edit3,
  Trash2,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { dataService, type CalendarEvent } from '@/services/dataService';

interface InteractiveCalendarProps {
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  onEventCreated?: (event: CalendarEvent) => void;
  className?: string;
}

interface EventFormData {
  title: string;
  description: string;
  start: Date;
  end: Date;
  allDay: boolean;
  category: 'work' | 'personal' | 'health' | 'social' | 'other';
  location?: string;
}

export const InteractiveCalendar: React.FC<InteractiveCalendarProps> = ({
  onEventClick,
  onDateClick,
  onEventCreated,
  className = ""
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  // Load events
  useEffect(() => {
    const startOfCurrentMonth = startOfMonth(currentDate);
    const endOfCurrentMonth = endOfMonth(currentDate);
    
    const monthEvents = dataService.getEvents({
      start: startOfCurrentMonth,
      end: endOfCurrentMonth
    });
    
    setEvents(monthEvents);
  }, [currentDate]);

  // Calendar navigation
  const goToPreviousMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // Get events for a specific date
  const getEventsForDate = (date: Date): CalendarEvent[] => {
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return isSameDay(eventDate, date);
    });
  };

  // Category colors
  const categoryColors = {
    work: 'bg-blue-500/20 border-blue-500 text-blue-700',
    personal: 'bg-green-500/20 border-green-500 text-green-700',
    health: 'bg-orange-500/20 border-orange-500 text-orange-700',
    social: 'bg-purple-500/20 border-purple-500 text-purple-700',
    other: 'bg-gray-500/20 border-gray-500 text-gray-700'
  };

  const categoryIcons = {
    work: '💼',
    personal: '🏠',
    health: '🏥',
    social: '👥',
    other: '📅'
  };

  // Handle date click
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onDateClick?.(date);
  };

  // Handle event click
  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setShowEventDialog(true);
    onEventClick?.(event);
  };

  // Create new event
  const handleCreateEvent = (date: Date) => {
    setSelectedDate(date);
    setShowCreateDialog(true);
  };

  const today = new Date();

  return (
    <div className={`w-full ${className}`}>
      <Card className="glass-strong p-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold gradient-text">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="rounded-full"
            >
              Today
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* View Toggle */}
            <div className="flex bg-muted/50 rounded-lg p-1">
              {(['month', 'week', 'day'] as const).map((viewType) => (
                <Button
                  key={viewType}
                  variant={view === viewType ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setView(viewType)}
                  className="capitalize rounded-md"
                >
                  {viewType}
                </Button>
              ))}
            </div>
            
            {/* Navigation */}
            <div className="flex bg-muted/50 rounded-lg">
              <Button
                variant="ghost"
                size="icon"
                onClick={goToPreviousMonth}
                className="rounded-l-lg rounded-r-none"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={goToNextMonth}
                className="rounded-r-lg rounded-l-none"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {view === 'month' && (
          <>
            {/* Calendar Grid Header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div
                  key={day}
                  className="p-2 text-center text-sm font-medium text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              <AnimatePresence mode="wait">
                {calendarDays.map((date, index) => {
                  const dayEvents = getEventsForDate(date);
                  const isToday = isSameDay(date, today);
                  const isSelected = selectedDate && isSameDay(date, selectedDate);
                  const isCurrentMonth = isSameMonth(date, currentDate);
                  const isHovered = hoveredDate && isSameDay(date, hoveredDate);

                  return (
                    <motion.div
                      key={date.toISOString()}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.01 }}
                      className={`
                        relative p-2 min-h-[100px] border border-border/20 rounded-lg
                        cursor-pointer transition-all duration-200 group
                        ${isCurrentMonth ? 'bg-background/50' : 'bg-muted/20'}
                        ${isToday ? 'ring-2 ring-primary/50 bg-primary/5' : ''}
                        ${isSelected ? 'ring-2 ring-primary bg-primary/10' : ''}
                        ${isHovered ? 'bg-muted/40 scale-105' : ''}
                        hover:bg-muted/40 hover:scale-105
                      `}
                      onClick={() => handleDateClick(date)}
                      onMouseEnter={() => setHoveredDate(date)}
                      onMouseLeave={() => setHoveredDate(null)}
                    >
                      {/* Date Number */}
                      <div className={`
                        text-sm font-medium mb-1
                        ${isToday ? 'text-primary font-bold' : isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}
                      `}>
                        {format(date, 'd')}
                      </div>

                      {/* Events */}
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map((event) => (
                          <motion.div
                            key={event.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`
                              text-xs p-1 rounded border-l-2 cursor-pointer
                              transition-all duration-200 hover:scale-105
                              ${categoryColors[event.category]}
                            `}
                            onClick={(e) => handleEventClick(event, e)}
                            title={`${event.title} - ${format(event.start, 'HH:mm')}`}
                          >
                            <div className="flex items-center space-x-1">
                              <span>{categoryIcons[event.category]}</span>
                              <span className="truncate font-medium">
                                {event.title}
                              </span>
                            </div>
                            {!event.allDay && (
                              <div className="text-xs opacity-70">
                                {format(event.start, 'HH:mm')}
                              </div>
                            )}
                          </motion.div>
                        ))}
                        
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-muted-foreground p-1">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>

                      {/* Add Event Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateEvent(date);
                        }}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </>
        )}

        {/* Week and Day views can be implemented similarly */}
        {view === 'week' && (
          <div className="text-center text-muted-foreground py-8">
            Week view coming soon! 📅
          </div>
        )}

        {view === 'day' && (
          <div className="text-center text-muted-foreground py-8">
            Day view coming soon! 📅
          </div>
        )}
      </Card>

      {/* Event Detail Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <span>{selectedEvent && categoryIcons[selectedEvent.category]}</span>
              <span>{selectedEvent?.title}</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>
                  {selectedEvent.allDay ? 
                    'All day' : 
                    `${format(selectedEvent.start, 'MMM d, HH:mm')} - ${format(selectedEvent.end, 'HH:mm')}`
                  }
                </span>
              </div>
              
              {selectedEvent.location && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{selectedEvent.location}</span>
                </div>
              )}
              
              {selectedEvent.description && (
                <div className="text-sm">
                  {selectedEvent.description}
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <Badge className={categoryColors[selectedEvent.category]}>
                  {selectedEvent.category}
                </Badge>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Edit functionality
                    setShowEventDialog(false);
                  }}
                >
                  <Edit3 className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (selectedEvent) {
                      dataService.deleteEvent(selectedEvent.id);
                      setEvents(prev => prev.filter(e => e.id !== selectedEvent.id));
                      setShowEventDialog(false);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Event Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <input
                type="text"
                className="w-full p-2 mt-1 bg-muted/50 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                placeholder="Event title..."
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Category</label>
              <select className="w-full p-2 mt-1 bg-muted/50 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none">
                <option value="personal">Personal</option>
                <option value="work">Work</option>
                <option value="health">Health</option>
                <option value="social">Social</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Start Time</label>
                <input
                  type="datetime-local"
                  className="w-full p-2 mt-1 bg-muted/50 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium">End Time</label>
                <input
                  type="datetime-local"
                  className="w-full p-2 mt-1 bg-muted/50 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={() => setShowCreateDialog(false)}>
                Create Event
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};