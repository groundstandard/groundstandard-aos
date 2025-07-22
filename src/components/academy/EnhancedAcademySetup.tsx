import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAcademy } from '@/hooks/useAcademy';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Building2, Palette, Globe, CheckCircle, Search, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { BackButton } from '@/components/ui/BackButton';

const EnhancedAcademySetup = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { academy, updateAcademy, refreshAcademy } = useAcademy();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showSearch, setShowSearch] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(!academy);
  
  const [formData, setFormData] = useState({
    name: academy?.name || '',
    description: academy?.description || '',
    website_url: academy?.website_url || '',
    phone: academy?.phone || '',
    email: academy?.email || '',
    address: academy?.address || '',
    city: academy?.city || '',
    state: academy?.state || '',
    zipcode: (academy as any)?.zipcode || '',
    country: academy?.country || 'USA',
    timezone: academy?.timezone || 'America/New_York',
    primary_color: academy?.primary_color || '#3B82F6',
    secondary_color: academy?.secondary_color || '#1E40AF',
  });

  // Check if user already has an academy on load
  useEffect(() => {
    if ((profile as any)?.academy_id && academy) {
      setShowSearch(false);
      setIsCreating(false);
    }
  }, [profile, academy]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const searchAcademies = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      // Clear previous results first
      setSearchResults([]);
      
      // Search for completed academies that are publicly searchable
      const { data, error } = await supabase
        .from('academies')
        .select('id, name, city, state, description')
        .eq('is_setup_complete', true)
        .or(`name.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%,state.ilike.%${searchQuery}%`)
        .limit(10);

      if (error) {
        console.error('Search error details:', error);
        throw error;
      }
      
      setSearchResults(data || []);
      
      if (data && data.length === 0) {
        toast({
          title: "No Results",
          description: "No academies found matching your search.",
        });
      }
    } catch (error) {
      console.error('Error searching academies:', error);
      toast({
        title: "Search Error",
        description: "Failed to search academies. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const joinAcademy = async (academyId: string) => {
    try {
      setIsSubmitting(true);
      
      // Use the secure database function to join academy
      const { data, error } = await supabase.rpc('join_academy', {
        academy_uuid: academyId
      });

      if (error) {
        console.error('Join academy error:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Failed to join academy - update unsuccessful');
      }

      // Refresh profile to get updated academy_id
      await refreshProfile();
      
      // Then refresh academy context
      await refreshAcademy();
      
      toast({
        title: "Academy Joined!",
        description: "You have successfully joined the academy.",
      });
      
      // Redirect to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error) {
      console.error('Error joining academy:', error);
      toast({
        title: "Error",
        description: "Failed to join academy. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStepSubmit = async () => {
    console.log('handleStepSubmit called, currentStep:', currentStep);
    console.log('formData:', formData);
    console.log('isCurrentStepValid:', isCurrentStepValid());
    
    if (!isCurrentStepValid()) {
      console.log('Step validation failed');
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields before continuing.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (isCreating) {
        // Create new academy
        const { data: newAcademy, error } = await supabase
          .from('academies')
          .insert({
            ...formData,
            owner_id: user?.id,
            slug: formData.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
            is_setup_complete: currentStep === 3
          })
          .select()
          .single();

        if (error) throw error;

        // Update user's profile to link to this academy
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ academy_id: newAcademy.id })
          .eq('id', user?.id);

        if (profileError) throw profileError;

        // Refresh academy context
        await refreshAcademy();
        setIsCreating(false);
      } else {
        // Update existing academy
        await updateAcademy({
          ...formData,
          is_setup_complete: currentStep === 3
        });
      }
      
      if (currentStep < 3) {
        console.log('Moving to next step from', currentStep, 'to', currentStep + 1);
        setCurrentStep(currentStep + 1);
      } else {
        toast({
          title: "Academy Setup Complete!",
          description: "Your academy is now ready to use.",
        });
        
        // Redirect to dashboard after successful completion
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (error) {
      console.error('Error with academy:', error);
      toast({
        title: "Error",
        description: `Failed to ${isCreating ? 'create' : 'update'} academy. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else if (!showSearch) {
      // Allow going back to search if we're on step 1
      setShowSearch(true);
      setIsCreating(true);
    }
  };

  const isCurrentStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.name.trim() && formData.email.trim();
      case 2:
        return formData.city.trim() && formData.state.trim();
      case 3:
        return true; // Branding is optional
      default:
        return false;
    }
  };

  const renderMainScreen = () => (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Academy Setup</CardTitle>
          <CardDescription className="text-lg">
            Find your academy or create a new one
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <Building2 className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-2">Welcome!</h2>
            <p className="text-muted-foreground text-lg">
              Do you want to join an existing academy or create a new one?
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Search for your academy</h3>
              <div className="flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter academy name, city, or state..."
                  onKeyPress={(e) => e.key === 'Enter' && searchAcademies()}
                  className="flex-1"
                />
                <Button onClick={searchAcademies} disabled={isSearching || !searchQuery.trim()}>
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
                  Search
                </Button>
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold">Found Academies:</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {searchResults.map((academy) => (
                    <Card key={academy.id} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold">{academy.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {academy.city}, {academy.state}
                          </p>
                          {academy.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {academy.description.substring(0, 100)}...
                            </p>
                          )}
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => joinAcademy(academy.id)}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Join"}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-border"></div>
                <span className="text-muted-foreground">OR</span>
                <div className="flex-1 h-px bg-border"></div>
              </div>
              
              <Button 
                onClick={() => {
                  setShowSearch(false);
                  setIsCreating(true);
                }}
                variant="outline"
                size="lg"
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Academy
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Building2 className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold">Basic Information</h2>
              <p className="text-muted-foreground">
                {isCreating ? "Let's create your academy" : "Tell us about your academy"}
              </p>
            </div>
            
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Academy Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="My Martial Arts Academy"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Contact Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="contact@myacademy.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="website">Website URL</Label>
                <Input
                  id="website"
                  value={formData.website_url}
                  onChange={(e) => handleInputChange('website_url', e.target.value)}
                  placeholder="https://myacademy.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brief description of your academy..."
                  rows={3}
                />
              </div>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Globe className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold">Location & Settings</h2>
              <p className="text-muted-foreground">Where is your academy located?</p>
            </div>
            
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="123 Main Street"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="New York"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    placeholder="NY"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="zipcode">Zipcode</Label>
                  <Input
                    id="zipcode"
                    value={formData.zipcode}
                    onChange={(e) => handleInputChange('zipcode', e.target.value)}
                    placeholder="10001"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    placeholder="USA"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <select
                  id="timezone"
                  value={formData.timezone}
                  onChange={(e) => handleInputChange('timezone', e.target.value)}
                  className="w-full p-2 border border-input rounded-md bg-background"
                >
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="America/Anchorage">Alaska Time (AKT)</option>
                  <option value="Pacific/Honolulu">Hawaii Time (HST)</option>
                </select>
              </div>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Palette className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold">Branding & Colors</h2>
              <p className="text-muted-foreground">Customize your academy's appearance</p>
            </div>
            
            <div className="grid gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="primary-color"
                      type="color"
                      value={formData.primary_color}
                      onChange={(e) => handleInputChange('primary_color', e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={formData.primary_color}
                      onChange={(e) => handleInputChange('primary_color', e.target.value)}
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="secondary-color">Secondary Color</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="secondary-color"
                      type="color"
                      value={formData.secondary_color}
                      onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={formData.secondary_color}
                      onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                      placeholder="#1E40AF"
                    />
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-card rounded-lg border">
                <h3 className="font-semibold mb-2">Color Preview</h3>
                <div className="flex gap-2">
                  <div 
                    className="w-16 h-16 rounded-lg border"
                    style={{ backgroundColor: formData.primary_color }}
                  />
                  <div 
                    className="w-16 h-16 rounded-lg border"
                    style={{ backgroundColor: formData.secondary_color }}
                  />
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  if (showSearch) {
    return renderMainScreen();
  }

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="absolute top-4 left-4">
        <BackButton />
      </div>
      
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">
            {isCreating ? "Create Your Academy" : "Welcome to Your Academy!"}
          </CardTitle>
          <CardDescription>
            {isCreating 
              ? "Let's set up your academy in just a few steps"
              : "Let's complete your academy setup"
            }
          </CardDescription>
          
          {/* Progress indicator */}
          <div className="flex justify-center gap-2 mt-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step < currentStep ? 'bg-green-500 text-white' :
                  step === currentStep ? 'bg-primary text-white' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {step < currentStep ? <CheckCircle className="w-4 h-4" /> : step}
                </div>
                {step < 3 && <div className="w-8 h-0.5 bg-muted mx-2" />}
              </div>
            ))}
          </div>
          
          <div className="flex justify-center mt-2">
            <Badge variant="secondary">
              Step {currentStep} of 3
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          {renderStep()}
          
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handlePreviousStep}
              disabled={isSubmitting}
            >
              Previous
            </Button>
            
            <Button
              onClick={handleStepSubmit}
              disabled={!isCurrentStepValid() || isSubmitting}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {currentStep === 3 ? (isCreating ? 'Create Academy' : 'Complete Setup') : 'Next Step'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedAcademySetup;