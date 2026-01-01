import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Clock, 
  User,
  Calendar,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CodeRedTicket {
  id: string;
  title: string;
  description: string | null;
  project_id: string;
  assigned_to: string | null;
  due_date: string | null;
  created_at: string;
  project?: { name: string };
  assignee?: { email: string; full_name: string | null };
}

export default function CodeRed() {
  const { isAdmin } = useAuth();
  const [tickets, setTickets] = useState<CodeRedTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCodeRedTickets = async () => {
    try {
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .eq('is_code_red', true)
        .neq('status', 'closed')
        .order('created_at', { ascending: false });

      if (ticketsError) throw ticketsError;

      // Fetch project and user info
      const { data: projects } = await supabase.from('projects').select('id, name');
      const { data: users } = await supabase.from('profiles').select('id, email, full_name');

      const ticketsWithInfo = (ticketsData || []).map(ticket => {
        const project = projects?.find(p => p.id === ticket.project_id);
        const assignee = users?.find(u => u.id === ticket.assigned_to);
        return {
          ...ticket,
          project: project ? { name: project.name } : undefined,
          assignee: assignee ? { email: assignee.email, full_name: assignee.full_name } : undefined,
        };
      });

      setTickets(ticketsWithInfo);
    } catch (error) {
      console.error('Error fetching code red tickets:', error);
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCodeRedTickets();
  }, []);

  const handleResolveAndClose = async (ticketId: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ 
          status: 'closed', 
          is_code_red: false,
          closed_at: new Date().toISOString() 
        })
        .eq('id', ticketId);

      if (error) throw error;

      toast.success('Ticket resolved and closed');
      fetchCodeRedTickets();
    } catch (error: any) {
      console.error('Error closing ticket:', error);
      toast.error(error.message || 'Failed to close ticket');
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-secondary/50 rounded w-48" />
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-48 bg-secondary/50 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-code-red/20 flex items-center justify-center glow-code-red">
            <AlertTriangle className="h-7 w-7 text-code-red" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-code-red">Code Red</h1>
            <p className="text-muted-foreground">
              Critical tickets requiring immediate attention
            </p>
          </div>
        </div>

        {tickets.length > 0 && (
          <Card codeRed className="animate-fade-in">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-code-red animate-pulse" />
                <span className="font-semibold text-code-red">
                  {tickets.length} critical {tickets.length === 1 ? 'issue' : 'issues'} active
                </span>
                <span className="text-muted-foreground">—</span>
                <span className="text-sm text-muted-foreground">
                  Immediate action required
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Code Red Tickets */}
      <div className="space-y-4">
        {tickets.length > 0 ? (
          tickets.map((ticket, index) => (
            <Card 
              key={ticket.id} 
              codeRed
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="code-red" className="gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Code Red
                    </Badge>
                    <span className="text-sm font-mono text-muted-foreground">
                      {ticket.id.slice(0, 8)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Created {getTimeAgo(ticket.created_at)}</span>
                  </div>
                </div>
                <CardTitle className="text-xl mt-2">{ticket.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{ticket.description || 'No description'}</p>
                
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  {ticket.project && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Project:</span>
                      <Badge variant="outline">{ticket.project.name}</Badge>
                    </div>
                  )}
                  {ticket.assignee && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{ticket.assignee.full_name || ticket.assignee.email.split('@')[0]}</span>
                    </div>
                  )}
                  {ticket.due_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Due: {new Date(ticket.due_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1">
                    View Details
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                  {isAdmin && (
                    <Button 
                      variant="success"
                      onClick={() => handleResolveAndClose(ticket.id)}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Resolve & Close
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="py-16">
            <CardContent className="text-center">
              <div className="h-16 w-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-xl font-semibold mb-2">All Clear</h3>
              <p className="text-muted-foreground">
                No critical tickets requiring immediate attention
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
