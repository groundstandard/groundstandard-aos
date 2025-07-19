import { format, isToday, isYesterday, isThisYear } from 'date-fns';

interface DateDividerProps {
  date: string;
}

export const DateDivider = ({ date }: DateDividerProps) => {
  const messageDate = new Date(date);
  
  const formatDate = (date: Date) => {
    if (isToday(date)) {
      return 'Today';
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else if (isThisYear(date)) {
      return format(date, 'EEEE, MMMM do');
    } else {
      return format(date, 'EEEE, MMMM do, yyyy');
    }
  };

  return (
    <div className="flex items-center my-6">
      <div className="flex-1 border-t border-border"></div>
      <div className="px-4 py-1 bg-background border border-border rounded-full text-xs font-medium text-muted-foreground">
        {formatDate(messageDate)}
      </div>
      <div className="flex-1 border-t border-border"></div>
    </div>
  );
};