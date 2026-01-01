import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Ticket, 
  FolderKanban, 
  AlertTriangle, 
  Clock, 
  CheckCircle2,
  ArrowRight,
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  overdueTickets: number;
  codeRedCount: number;
  projectCount: number;
}

interface RecentActivity {
  id: string;
  action: string;
  ticket_id: string;
  created_at: string;
}

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalTickets: 0,
    openTickets: 0,
    resolvedTickets: 0,
    overdueTickets: 0,
    codeRedCount: 0,
    projectCount: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      try {
        // Fetch tickets
        const { data: tickets, error: ticketsError } = await supabase
          .from('tickets')
          .select('*');
        
        if (ticketsError) throw ticketsError;

        // Fetch projects
        const { data: projects, error: projectsError } = await supabase
          .from('projects')
          .select('id');
        
        if (projectsError) throw projectsError;

        // Fetch recent activity
        const { data: activity, error: activityError } = await supabase
          .from('ticket_activity')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(3);

        if (activityError) throw activityError;

        // Calculate stats
        const now = new Date();
        const ticketsList = tickets || [];
        
        setStats({
          totalTickets: ticketsList.length,
          openTickets: ticketsList.filter(t => t.status === 'wip' || t.status === 'pending').length,
          resolvedTickets: ticketsList.filter(t => t.status === 'resolved').length,
          overdueTickets: ticketsList.filter(t => 
            t.due_date && new Date(t.due_date) < now && t.status !== 'closed'
          ).length,
          codeRedCount: ticketsList.filter(t => t.is_code_red && t.status !== 'closed').length,
          projectCount: (projects || []).length,
        });

        setRecentActivity(activity || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-secondary/50 rounded w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-secondary/50 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">
          Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}
        </h1>
        <p className="text-muted-foreground">
          {isAdmin 
            ? "Here's an overview of your team's ticketing activity." 
            : "Here's an overview of your assigned tickets."}
        </p>
      </div>

      {/* Code Red Alert */}
      {stats.codeRedCount > 0 && (
        <Card codeRed className="animate-fade-in">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-code-red/20 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-code-red" />
                </div>
                <div>
                  <p className="font-semibold text-code-red">Code Red Active</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.codeRedCount} critical {stats.codeRedCount === 1 ? 'ticket needs' : 'tickets need'} immediate attention
                  </p>
                </div>
              </div>
              <Link to="/dashboard/code-red">
                <Button variant="code-red" size="sm">
                  View Now
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hover className="animate-fade-in stagger-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tickets
            </CardTitle>
            <Ticket className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalTickets}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all projects
            </p>
          </CardContent>
        </Card>

        <Card hover className="animate-fade-in stagger-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Open Tickets
            </CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.openTickets}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="status-wip">WIP</Badge>
              <Badge variant="status-pending">Pending</Badge>
            </div>
          </CardContent>
        </Card>

        <Card hover className="animate-fade-in stagger-3">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Resolved
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.resolvedTickets}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting admin closure
            </p>
          </CardContent>
        </Card>

        {isAdmin && (
          <Card hover className="animate-fade-in stagger-4">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Projects
              </CardTitle>
              <FolderKanban className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.projectCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Active projects
              </p>
            </CardContent>
          </Card>
        )}

        {!isAdmin && (
          <Card hover className="animate-fade-in stagger-4">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Overdue
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{stats.overdueTickets}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Past due date
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Ticket className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-4">
                No recent activity
              </p>
            )}
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isAdmin && (
              <>
                <Link to="/dashboard/projects" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <FolderKanban className="h-4 w-4 mr-2" />
                    Manage Projects
                    <ArrowRight className="h-4 w-4 ml-auto" />
                  </Button>
                </Link>
                <Link to="/dashboard/tickets" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Ticket className="h-4 w-4 mr-2" />
                    Manage Tickets
                    <ArrowRight className="h-4 w-4 ml-auto" />
                  </Button>
                </Link>
                <Link to="/dashboard/users" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <AlertTriangle className="h-4 w-4 mr-2 text-warning" />
                    View Pending Approvals
                    <Badge variant="warning" className="ml-auto">{stats.resolvedTickets}</Badge>
                  </Button>
                </Link>
              </>
            )}
            {!isAdmin && (
              <>
                <Link to="/dashboard/tickets" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Ticket className="h-4 w-4 mr-2" />
                    View My Tickets
                    <Badge variant="secondary" className="ml-auto">{stats.openTickets}</Badge>
                  </Button>
                </Link>
                <Link to="/dashboard/analytics" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Zap className="h-4 w-4 mr-2" />
                    View My Performance
                    <ArrowRight className="h-4 w-4 ml-auto" />
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
