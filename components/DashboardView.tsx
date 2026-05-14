
import React from 'react';
import { CalendarEvent, Category } from '../types';
import { CalendarIcon, ClockIcon, CalendarWeekIcon } from './Icons';
import { getCategoryHexColor } from '../utils/color';

interface DashboardViewProps {
  events: CalendarEvent[];
  allCategories: Category[];
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg flex items-center gap-4">
        <div className={`p-3 rounded-full ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
        </div>
    </div>
);

const DashboardView: React.FC<DashboardViewProps> = ({ events, allCategories }) => {
    // Calculations
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const eventsToday = events.filter(e => {
        const eventDate = new Date(e.start);
        return new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate()).getTime() === startOfToday.getTime();
    }).length;

    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfToday.getDay()); // Sunday
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
    endOfWeek.setHours(23, 59, 59, 999);

    const eventsThisWeek = events.filter(e => {
        const eventDate = new Date(e.start);
        return eventDate >= startOfWeek && eventDate <= endOfWeek;
    }).length;

    const upcomingEvents = events
        .filter(event => new Date(event.start) > new Date())
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
        .slice(0, 5);

    const categoryCounts: { [key: string]: number } = {};
    let totalCategoryTags = 0;
    events.forEach(event => {
        const categories = event.category && event.category.length > 0 ? event.category : ['General'];
        categories.forEach(categoryName => {
            categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
            totalCategoryTags++;
        });
    });

    const categoryStats = Object.entries(categoryCounts)
        .map(([name, count]) => ({
            name,
            count,
            percentage: totalCategoryTags > 0 ? (count / totalCategoryTags) * 100 : 0,
            color: getCategoryHexColor(name, allCategories),
        }))
        .sort((a, b) => b.count - a.count);
        
    const timeUntil = (dateString: string): string => {
        const eventDate = new Date(dateString);
        const now = new Date();
        const diffTime = eventDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));

        if (diffDays <= 0) {
            if (diffHours > 0) return `in ${diffHours} hour(s)`;
            return "Today";
        }
        if (diffDays === 1) return "Tomorrow";
        if (diffDays <= 7) return `in ${diffDays} days`;
        return eventDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    return (
        <div className="mt-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">Dashboard</h2>
      
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    title="Total Events"
                    value={events.length}
                    icon={<CalendarIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />}
                    color="bg-indigo-100 dark:bg-indigo-500/20"
                />
                <StatCard 
                    title="Events Today"
                    value={eventsToday}
                    icon={<ClockIcon className="w-6 h-6 text-green-600 dark:text-green-400" />}
                    color="bg-green-100 dark:bg-green-500/20"
                />
                <StatCard 
                    title="Events this Week"
                    value={eventsThisWeek}
                    icon={<CalendarWeekIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />}
                    color="bg-amber-100 dark:bg-amber-500/20"
                />
            </div>
            
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Category Breakdown</h3>
                    {categoryStats.length > 0 ? (
                        <div className="space-y-4">
                            {categoryStats.map(stat => (
                                <div key={stat.name}>
                                    <div className="flex justify-between items-center mb-1 text-sm">
                                        <span className="font-semibold text-slate-600 dark:text-slate-300">{stat.name}</span>
                                        <span className="text-slate-500 dark:text-slate-400">{stat.count} event(s)</span>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                                        <div 
                                            className="h-2.5 rounded-full" 
                                            style={{ width: `${stat.percentage}%`, backgroundColor: stat.color }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-slate-500 dark:text-slate-400 py-8">No events with categories yet.</p>
                    )}
                </div>
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Upcoming Deadlines</h3>
                    {upcomingEvents.length > 0 ? (
                    <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                        {upcomingEvents.map(event => (
                        <li key={event.id} className="py-3 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{backgroundColor: getCategoryHexColor(event.category, allCategories)}}></span>
                                <div>
                                    <p className="font-semibold text-slate-700 dark:text-slate-200 truncate">{event.title}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{event.category?.join(', ') || 'General'}</p>
                                </div>
                            </div>
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 shrink-0">
                                {timeUntil(event.start)}
                            </p>
                        </li>
                        ))}
                    </ul>
                    ) : (
                    <p className="text-center text-slate-500 dark:text-slate-400 py-8">No upcoming deadlines. You're all caught up!</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardView;