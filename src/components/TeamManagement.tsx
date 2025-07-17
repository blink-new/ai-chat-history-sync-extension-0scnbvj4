import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { 
  Users, 
  UserPlus, 
  Crown, 
  Mail, 
  Settings,
  Trash2,
  Shield,
  ShieldCheck
} from 'lucide-react';
import CloudService, { Team, TeamMember } from '../lib/cloud-service';
import { PremiumGate } from './PremiumGate';
import { PremiumManager } from '../lib/premium';

export const TeamManagement: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const cloudService = CloudService.getInstance();
  const premiumManager = PremiumManager.getInstance();

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  const loadTeams = useCallback(async () => {
    try {
      setIsLoading(true);
      const userTeams = await cloudService.getUserTeams();
      setTeams(userTeams);
      if (userTeams.length > 0 && !selectedTeam) {
        setSelectedTeam(userTeams[0]);
      }
    } catch (error) {
      console.error('Failed to load teams:', error);
    } finally {
      setIsLoading(false);
    }
  }, [cloudService, selectedTeam]);

  const createTeam = async () => {
    if (!newTeamName.trim()) return;

    try {
      const team = await cloudService.createTeam(newTeamName);
      setTeams(prev => [...prev, team]);
      setSelectedTeam(team);
      setNewTeamName('');
    } catch (error) {
      console.error('Failed to create team:', error);
    }
  };

  const inviteMember = async () => {
    if (!selectedTeam || !inviteEmail.trim()) return;

    try {
      await cloudService.inviteTeamMember(selectedTeam.id, inviteEmail);
      setInviteEmail('');
      // In a real app, this would refresh the member list
    } catch (error) {
      console.error('Failed to invite member:', error);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'admin':
        return <ShieldCheck className="h-4 w-4 text-blue-500" />;
      default:
        return <Shield className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      owner: 'default',
      admin: 'secondary',
      member: 'outline'
    } as const;

    return (
      <Badge variant={variants[role as keyof typeof variants] || 'outline'}>
        {role}
      </Badge>
    );
  };

  if (!premiumManager.isPremiumUser()) {
    return (
      <PremiumGate feature="Team Management">
        <div />
      </PremiumGate>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Team Creation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Management
          </CardTitle>
          <CardDescription>
            Create and manage teams for collaborative conversation history
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Team name"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createTeam()}
            />
            <Button onClick={createTeam} disabled={!newTeamName.trim()}>
              Create Team
            </Button>
          </div>

          {teams.length > 0 && (
            <div className="space-y-2">
              <Label>Your Teams</Label>
              <div className="grid gap-2">
                {teams.map((team) => (
                  <div
                    key={team.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedTeam?.id === team.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedTeam(team)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{team.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {team.maxMembers} members max
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{team.subscriptionTier}</Badge>
                        <Crown className="h-4 w-4 text-yellow-500" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Details */}
      {selectedTeam && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{selectedTeam.name}</span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{selectedTeam.subscriptionStatus}</Badge>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-1" />
                  Settings
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              Team created on {selectedTeam.createdAt.toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Member Invitation */}
            <div className="space-y-2">
              <Label>Invite New Member</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && inviteMember()}
                />
                <Button onClick={inviteMember} disabled={!inviteEmail.trim()}>
                  <UserPlus className="h-4 w-4 mr-1" />
                  Invite
                </Button>
              </div>
            </div>

            <Separator />

            {/* Team Members */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Team Members</Label>
                <Badge variant="outline">{teamMembers.length} / {selectedTeam.maxMembers}</Badge>
              </div>

              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {teamMembers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No team members yet</p>
                      <p className="text-sm">Invite members to start collaborating</p>
                    </div>
                  ) : (
                    teamMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {getRoleIcon(member.role)}
                          <div>
                            <p className="font-medium">{member.userId}</p>
                            <p className="text-sm text-muted-foreground">
                              Joined {member.joinedAt.toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getRoleBadge(member.role)}
                          {member.role !== 'owner' && (
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Team Statistics */}
            <Separator />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{teamMembers.length}</p>
                <p className="text-sm text-muted-foreground">Members</p>
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Shared Conversations</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{selectedTeam.subscriptionStatus === 'active' ? '✓' : '✗'}</p>
                <p className="text-sm text-muted-foreground">Active Subscription</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {teams.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Teams Yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first team to start collaborating with others
            </p>
            <Button onClick={() => document.querySelector('input')?.focus()}>
              <UserPlus className="h-4 w-4 mr-2" />
              Create Your First Team
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};