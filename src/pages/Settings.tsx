import { useAuth } from "@/hooks/useAuth";
import { useAcademy } from "@/hooks/useAcademy";
import { useIsMobile } from "@/hooks/use-mobile";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/button";
import { Navigate, useNavigate } from "react-router-dom";
import { Settings as SettingsIcon, User, Bell, Shield, Database, Palette, Mail, Upload, X, LogOut, Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Settings = () => {
  const { user, profile, signOut } = useAuth();
  const { academy, updateAcademy } = useAcademy();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('settings');
  const [academyFormData, setAcademyFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    city: '',
    state: '',
    zipcode: '',
    country: '',
    timezone: '',
    website_url: '',
    description: ''
  });

  useEffect(() => {
    if (academy) {
      setAcademyFormData({
        name: academy.name || '',
        address: academy.address || '',
        phone: academy.phone || '',
        email: academy.email || '',
        city: (academy as any).city || '',
        state: (academy as any).state || '',
        zipcode: (academy as any).zipcode || '',
        country: (academy as any).country || '',
        timezone: (academy as any).timezone || '',
        website_url: (academy as any).website_url || '',
        description: (academy as any).description || ''
      });
    }
  }, [academy]);

  const handleAcademyInputChange = (field: string, value: string) => {
    setAcademyFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveAcademySettings = async () => {
    try {
      await updateAcademy(academyFormData);
      toast({
        title: "Success",
        description: "Academy settings saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save academy settings",
        variant: "destructive",
      });
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !academy?.id) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image must be smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${academy.id}/logo.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('academy-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('academy-logos')
        .getPublicUrl(fileName);

      if (urlData?.publicUrl) {
        // Update academy with logo URL
        await updateAcademy({ logo_url: urlData.publicUrl });
        toast({
          title: "Success",
          description: "Academy logo uploaded successfully",
        });
      }
    } catch (error) {
      console.error('Logo upload error:', error);
      toast({
        title: "Error",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = async () => {
    if (!academy?.id) return;

    try {
      // Update academy to remove logo URL
      await updateAcademy({ logo_url: null });
      toast({
        title: "Success",
        description: "Academy logo removed successfully",
      });
    } catch (error) {
      console.error('Logo removal error:', error);
      toast({
        title: "Error",
        description: "Failed to remove logo. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-7xl">
        <div className="flex items-start gap-2 sm:gap-4 mb-6 sm:mb-8">
          <BackButton />
          <div className="flex-1">
            <h1 className="text-xl sm:text-3xl font-bold text-foreground flex items-center gap-2 flex-wrap">
              <SettingsIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <span className="break-words">Settings</span>
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Manage your account settings and preferences
            </p>
          </div>
        </div>

        {/* Settings Navigation Ribbon */}
        <div className="flex items-center gap-4 border-b border-border pb-4 mb-6 overflow-x-auto">
          <Button 
            variant="ghost" 
            className={`flex items-center gap-2 whitespace-nowrap ${selectedTab === 'settings' ? 'text-primary border-b-2 border-primary' : 'hover:text-primary'} pb-2`}
            onClick={() => setSelectedTab('settings')}
          >
            <SettingsIcon className="h-4 w-4" />
            Profile Settings
          </Button>
          <Button 
            variant="ghost" 
            className="flex items-center gap-2 hover:text-primary whitespace-nowrap" 
            onClick={() => navigate('/automations')}
          >
            <Activity className="h-4 w-4" />
            Automations
          </Button>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="academy">Academy</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Update your personal information and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" defaultValue={profile?.first_name || ''} />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" defaultValue={profile?.last_name || ''} />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue={profile?.email || ''} />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" defaultValue={profile?.phone || ''} />
                </div>

                <div>
                  <Label htmlFor="beltLevel">Belt Level</Label>
                  <Select defaultValue={profile?.belt_level || 'white'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="white">White Belt</SelectItem>
                      <SelectItem value="yellow">Yellow Belt</SelectItem>
                      <SelectItem value="orange">Orange Belt</SelectItem>
                      <SelectItem value="green">Green Belt</SelectItem>
                      <SelectItem value="blue">Blue Belt</SelectItem>
                      <SelectItem value="purple">Purple Belt</SelectItem>
                      <SelectItem value="brown">Brown Belt</SelectItem>
                      <SelectItem value="black">Black Belt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Choose how you want to be notified about important updates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Class Reminders</Label>
                      <p className="text-sm text-muted-foreground">Get reminded about upcoming classes</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Payment Reminders</Label>
                      <p className="text-sm text-muted-foreground">Receive payment due notifications</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Event Announcements</Label>
                      <p className="text-sm text-muted-foreground">Stay updated on academy events</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Belt Testing Updates</Label>
                      <p className="text-sm text-muted-foreground">Notifications about belt testing opportunities</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Manage your account security and privacy
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" type="password" />
                </div>
                
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" />
                </div>
                
                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input id="confirmPassword" type="password" />
                </div>

                <Button>Update Password</Button>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Two-Factor Authentication</h4>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                  <Button variant="outline">Enable Two-Factor Authentication</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="academy" className="space-y-6">
            {(profile?.role === 'admin' || profile?.role === 'owner') ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Academy Settings
                  </CardTitle>
                  <CardDescription>
                    Configure academy-wide settings and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Academy Logo Section */}
                  <div className="space-y-4">
                    <Label>Academy Logo</Label>
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={academy?.logo_url} alt={academy?.name} />
                        <AvatarFallback className="text-lg">
                          <Database className="h-8 w-8" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col space-y-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                          className="flex items-center gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          {isUploading ? 'Uploading...' : 'Upload Logo'}
                        </Button>
                        {academy?.logo_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRemoveLogo}
                            className="flex items-center gap-2 text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                            Remove Logo
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Upload an image (PNG, JPG, or GIF) up to 5MB. Recommended size: 200x200 pixels.
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <Label htmlFor="academyName">Academy Name</Label>
                    <Input 
                      id="academyName" 
                      value={academyFormData.name}
                      onChange={(e) => handleAcademyInputChange('name', e.target.value)}
                      placeholder="Enter academy name" 
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="academyAddress">Street Address</Label>
                    <Input 
                      id="academyAddress" 
                      value={academyFormData.address}
                      onChange={(e) => handleAcademyInputChange('address', e.target.value)}
                      placeholder="Enter academy address" 
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="academyCity">City</Label>
                      <Input 
                        id="academyCity" 
                        value={academyFormData.city}
                        onChange={(e) => handleAcademyInputChange('city', e.target.value)}
                        placeholder="City" 
                      />
                    </div>
                    <div>
                      <Label htmlFor="academyState">State</Label>
                      <Input 
                        id="academyState" 
                        value={academyFormData.state}
                        onChange={(e) => handleAcademyInputChange('state', e.target.value)}
                        placeholder="State" 
                      />
                    </div>
                    <div>
                      <Label htmlFor="academyZipcode">Zipcode</Label>
                      <Input 
                        id="academyZipcode" 
                        value={academyFormData.zipcode}
                        onChange={(e) => handleAcademyInputChange('zipcode', e.target.value)}
                        placeholder="Zipcode" 
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="academyPhone">Phone</Label>
                      <Input 
                        id="academyPhone" 
                        type="tel" 
                        value={academyFormData.phone}
                        onChange={(e) => handleAcademyInputChange('phone', e.target.value)}
                        placeholder="Academy phone number" 
                      />
                    </div>
                    <div>
                      <Label htmlFor="academyEmail">Email</Label>
                      <Input 
                        id="academyEmail" 
                        type="email" 
                        value={academyFormData.email}
                        onChange={(e) => handleAcademyInputChange('email', e.target.value)}
                        placeholder="Academy email" 
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="academyWebsite">Website URL</Label>
                    <Input 
                      id="academyWebsite" 
                      value={academyFormData.website_url}
                      onChange={(e) => handleAcademyInputChange('website_url', e.target.value)}
                      placeholder="https://example.com" 
                    />
                  </div>

                  <div>
                    <Label htmlFor="timezone">Time Zone</Label>
                    <Select 
                      value={academyFormData.timezone} 
                      onValueChange={(value) => handleAcademyInputChange('timezone', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                        <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                        <SelectItem value="America/Anchorage">Alaska Time (AKT)</SelectItem>
                        <SelectItem value="Pacific/Honolulu">Hawaii Time (HST)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={handleSaveAcademySettings}>Save Academy Settings</Button>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Communication Settings
                    </h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Automated Reminders</Label>
                        <p className="text-sm text-muted-foreground">Send automatic payment and class reminders</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Marketing Emails</Label>
                        <p className="text-sm text-muted-foreground">Allow promotional emails to students</p>
                      </div>
                      <Switch />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <LogOut className="h-4 w-4" />
                      Account Management
                    </h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Sign Out</Label>
                        <p className="text-sm text-muted-foreground">Sign out of your administrator account</p>
                      </div>
                      <Button 
                        variant="destructive" 
                        onClick={signOut}
                        className="flex items-center gap-2"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center text-muted-foreground">
                    Academy settings are only available to administrators.
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;