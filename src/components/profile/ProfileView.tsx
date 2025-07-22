import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Camera, Edit, Save, X, Phone, Shield, Crown, Star, Building2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAcademy } from '@/hooks/useAcademy';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProfileViewProps {
  section?: 'personal' | 'subscription' | 'academy' | 'account';
}

export const ProfileView = ({ section = 'personal' }: ProfileViewProps) => {
  const navigate = useNavigate();
  const { profile, user, signOut } = useAuth();
  const { academy } = useAcademy();
  const { subscriptionInfo, openCustomerPortal } = useSubscription();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    emergency_contact: '',
    belt_level: ''
  });
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        emergency_contact: profile.emergency_contact || '',
        belt_level: profile.belt_level || ''
      });
    }
  }, [profile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile?.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Profile updated successfully'
      });

      setIsEditing(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update profile'
      });
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        emergency_contact: profile.emergency_contact || '',
        belt_level: profile.belt_level || ''
      });
    }
    setIsEditing(false);
  };

  const getInitials = () => {
    if (!profile) return 'U';
    return `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase();
  };

  const getMembershipStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'alumni': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!profile) {
    return (
      <div className="space-y-6">
        <Card className="card-minimal">
          <CardContent className="p-6">
            <div className="text-center">Loading profile...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderPersonalSection = () => (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="card-minimal shadow-elegant">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24 shadow-soft">
                <AvatarImage src={avatarUrl} alt={`${profile.first_name} ${profile.last_name}`} />
                <AvatarFallback className="text-xl font-semibold bg-muted">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="outline"
                size="sm"
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0 shadow-soft"
                disabled={uploading}
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-semibold text-foreground">
                  {profile.first_name} {profile.last_name}
                </h2>
                <Badge variant="outline" className={getMembershipStatusColor(profile.membership_status)}>
                  {profile.membership_status}
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <Shield className="h-3 w-3" />
                  {profile.role === 'admin' ? 'Admin' : profile.role === 'instructor' ? 'Instructor' : 'Student'}
                </Badge>
              </div>
              <p className="text-muted-foreground">{profile.email}</p>
              {profile.belt_level && (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  {profile.belt_level} Belt
                </Badge>
              )}
            </div>
          </div>

          {/* Profile Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="first_name">First Name</Label>
                {isEditing ? (
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <div className="mt-1 p-2 min-h-[2.5rem] flex items-center">
                    {profile.first_name || 'Not provided'}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="last_name">Last Name</Label>
                {isEditing ? (
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <div className="mt-1 p-2 min-h-[2.5rem] flex items-center">
                    {profile.last_name || 'Not provided'}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="belt_level">Belt Level</Label>
                {isEditing ? (
                  <Input
                    id="belt_level"
                    value={formData.belt_level}
                    onChange={(e) => handleInputChange('belt_level', e.target.value)}
                    placeholder="e.g., White, Yellow, Orange..."
                    className="mt-1"
                  />
                ) : (
                  <div className="mt-1 p-2 min-h-[2.5rem] flex items-center">
                    {profile.belt_level || 'Not specified'}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                    className="mt-1"
                  />
                ) : (
                  <div className="mt-1 p-2 min-h-[2.5rem] flex items-center gap-2">
                    {profile.phone ? (
                      <>
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {profile.phone}
                      </>
                    ) : (
                      'Not provided'
                    )}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="emergency_contact">Emergency Contact</Label>
                {isEditing ? (
                  <Textarea
                    id="emergency_contact"
                    value={formData.emergency_contact}
                    onChange={(e) => handleInputChange('emergency_contact', e.target.value)}
                    placeholder="Name and phone number of emergency contact"
                    className="mt-1 min-h-[5rem]"
                  />
                ) : (
                  <div className="mt-1 p-2 min-h-[5rem] flex items-start">
                    {profile.emergency_contact || 'Not provided'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSubscriptionSection = () => (
    <div className="space-y-6">
      {/* Subscription Status */}
      <Card className="card-minimal shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Subscription Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscriptionInfo?.subscribed ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-gradient-primary">
                      Active Subscription
                    </Badge>
                    <Badge variant="outline">
                      {subscriptionInfo.subscription_tier}
                    </Badge>
                  </div>
                  {subscriptionInfo.subscription_end && (
                    <p className="text-sm text-muted-foreground">
                      Renews on {new Date(subscriptionInfo.subscription_end).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={() => openCustomerPortal()}
                  className="gap-2"
                >
                  <Star className="h-4 w-4" />
                  Manage Plan
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gradient-subtle rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">✓</div>
                  <p className="text-sm font-medium">Premium Access</p>
                  <p className="text-xs text-muted-foreground">All features unlocked</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">∞</div>
                  <p className="text-sm font-medium">Unlimited Classes</p>
                  <p className="text-xs text-muted-foreground">Book any class</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Badge variant="secondary">Free Plan</Badge>
                  <p className="text-sm text-muted-foreground">
                    Upgrade to unlock premium features
                  </p>
                </div>
                <Button
                  onClick={() => navigate('/subscription')}
                  className="gap-2"
                >
                  <Crown className="h-4 w-4" />
                  Upgrade Now
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/20 rounded-lg">
                <div className="text-center opacity-60">
                  <div className="text-2xl font-bold text-muted-foreground">3</div>
                  <p className="text-sm font-medium">Classes/Month</p>
                  <p className="text-xs text-muted-foreground">Limited access</p>
                </div>
                <div className="text-center opacity-60">
                  <div className="text-2xl font-bold text-muted-foreground">📚</div>
                  <p className="text-sm font-medium">Basic Content</p>
                  <p className="text-xs text-muted-foreground">Essential features only</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderAcademySection = () => (
    <div className="space-y-6">
      {/* Academy Information */}
      {academy && (
        <Card className="card-minimal shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Academy Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Academy Name</Label>
                <div className="mt-1 p-2">
                  {academy.name}
                </div>
              </div>
              <div>
                <Label>Contact Email</Label>
                <div className="mt-1 p-2">
                  {academy.email || 'Not provided'}
                </div>
              </div>
              <div>
                <Label>Phone Number</Label>
                <div className="mt-1 p-2">
                  {academy.phone || 'Not provided'}
                </div>
              </div>
              <div>
                <Label>Location</Label>
                <div className="mt-1 p-2">
                  {academy.address ? `${academy.address}${(academy as any).city ? `, ${(academy as any).city}` : ''}${(academy as any).state ? `, ${(academy as any).state}` : ''}` : 'Not provided'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderAccountSection = () => (
    <div className="space-y-6">
      {/* Account Information */}
      <Card className="card-minimal shadow-soft">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Email Address</Label>
              <div className="mt-1 p-2 bg-muted/30 rounded-md text-muted-foreground">
                {profile.email}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Contact admin to change email address
              </p>
            </div>
            <div>
              <Label>Member Since</Label>
              <div className="mt-1 p-2">
                {new Date(profile.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card className="card-minimal shadow-soft">
        <CardHeader>
          <CardTitle>Account Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-start">
            <Button
              variant="destructive"
              onClick={signOut}
              className="gap-2"
            >
              <User className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  switch (section) {
    case 'subscription':
      return renderSubscriptionSection();
    case 'academy':
      return renderAcademySection();
    case 'account':
      return renderAccountSection();
    default:
      return renderPersonalSection();
  }
};