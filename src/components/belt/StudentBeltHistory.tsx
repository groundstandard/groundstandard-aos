import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Award, Calendar, User, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface BeltHistoryRecord {
  id: string;
  belt_level: string;
  promoted_date: string;
  promoted_by: string;
  notes: string | null;
  classes_completed_at_previous_belt: number;
  time_at_previous_belt_months: number;
  promoter: {
    first_name: string;
    last_name: string;
  } | null;
}

interface StudentBeltHistoryProps {
  studentId: string;
  studentName?: string;
}

export const StudentBeltHistory = ({ studentId, studentName }: StudentBeltHistoryProps) => {
  const { data: beltHistory, isLoading } = useQuery({
    queryKey: ['student-belt-history', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_belt_history')
        .select(`
          *,
          promoter:promoted_by(first_name, last_name)
        `)
        .eq('student_id', studentId)
        .order('promoted_date', { ascending: false });

      if (error) throw error;
      return data as any;
    }
  });

  const getBeltColor = (beltLevel: string) => {
    const colors: Record<string, string> = {
      'White': 'bg-gray-100 text-gray-800 border-gray-200',
      'Yellow': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Orange': 'bg-orange-100 text-orange-800 border-orange-200',
      'Green': 'bg-green-100 text-green-800 border-green-200',
      'Blue': 'bg-blue-100 text-blue-800 border-blue-200',
      'Purple': 'bg-purple-100 text-purple-800 border-purple-200',
      'Brown': 'bg-amber-100 text-amber-800 border-amber-200',
      'Black': 'bg-gray-900 text-white border-gray-700'
    };
    return colors[beltLevel] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Belt Progression History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-4 p-4 border rounded-lg">
                <div className="h-12 w-12 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          Belt Progression History
          {studentName && (
            <span className="text-muted-foreground font-normal">- {studentName}</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!beltHistory || beltHistory.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Award className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No belt progression history found</p>
            <p className="text-sm">This student hasn't been promoted yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {beltHistory.map((record, index) => (
              <div
                key={record.id}
                className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-shrink-0">
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10">
                        <Award className="h-6 w-6 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                    {index === 0 && (
                      <div className="absolute -top-1 -right-1 h-4 w-4 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-xs text-white">★</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className={getBeltColor(record.belt_level)}>
                      {record.belt_level}
                    </Badge>
                    {index === 0 && (
                      <Badge variant="outline" className="text-xs">
                        Current Belt
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(record.promoted_date), 'MMM dd, yyyy')}
                    </div>
                    {record.promoter && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {record.promoter.first_name} {record.promoter.last_name}
                      </div>
                    )}
                  </div>

                  {record.notes && (
                    <div className="flex items-start gap-1 text-sm">
                      <FileText className="h-3 w-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <p className="text-muted-foreground">{record.notes}</p>
                    </div>
                  )}
                </div>

                <div className="text-xs text-muted-foreground">
                  {format(new Date(record.promoted_date), 'h:mm a')}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};