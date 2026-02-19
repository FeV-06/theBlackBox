import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, addDays, subDays, isSameMonth, isSameDay, isToday } from "date-fns";

/**
 * Generates a 6-week (42-day) grid for the given month's calendar view.
 * Includes padding days from the previous and next months.
 */
export function buildMonthGrid(bgDate: Date): Date[] {
    const monthStart = startOfMonth(bgDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart); // Default starts on Sunday
    const endDate = endOfWeek(monthEnd);

    // Ensure we have at least 6 weeks to cover all scenarios (and fixed height)
    // Calculate how many days we have so far
    let days = eachDayOfInterval({ start: startDate, end: endDate });

    // If we have less than 42 days, add more weeks
    if (days.length < 42) {
        const remaining = 42 - days.length;
        const lastDay = days[days.length - 1];
        const extraDays = eachDayOfInterval({
            start: addDays(lastDay, 1),
            end: addDays(lastDay, remaining)
        });
        days = [...days, ...extraDays];
    } else if (days.length > 42) {
        // Rare case 6 weeks isn't enough? Actually 6 weeks * 7 = 42.
        // startOfWeek to endOfWeek is usually 4/5 weeks.
        // We force 42.
        days = days.slice(0, 42);
    }

    return days;
}

export { isSameMonth, isSameDay, isToday, startOfMonth, endOfMonth, addDays, subDays };
