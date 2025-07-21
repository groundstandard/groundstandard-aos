import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Palette,
  CheckCircle,
  ArrowRight,
  Users,
  Calendar
} from 'lucide-react';

interface AcademySetupData {
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipcode: string;
  phone: string;
  email: string;
  website_url: string;
  primary_color: string;
  secondary_color: string;
}

const steps = [
  { id: 'basic', title: 'Basic Information', icon: Building2 },
  { id: 'location', title: 'Location Details', icon: MapPin },
  { id: 'contact', title: 'Contact Information', icon: Phone },
  { id: 'branding', title: 'Branding & Colors', icon: Palette },
  { id: 'complete', title: 'Complete Setup', icon: CheckCircle }
];

export const AcademyOnboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<AcademySetupData>({
    name: '',
    description: '',
    address: '',
    city: '',
    state: '',
    country: 'USA',
    zipcode: '',
    phone: '',
    email: user?.email || '',
    website_url: '',
    primary_color: '#3B82F6',
    secondary_color: '#1E40AF'
  });

  const handleInputChange = (field: keyof AcademySetupData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Basic Information
        return !!(formData.name && formData.description);
      case 1: // Location
        return !!(formData.address && formData.city && formData.state && formData.zipcode);
      case 2: // Contact
        return !!(formData.phone && formData.email);
      case 3: // Branding
        return !!(formData.primary_color && formData.secondary_color);
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    } else {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields before continuing.",
        variant: "destructive"
      });
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const completeSetup = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Create the academy
      const { data: academy, error: academyError } = await supabase
        .from('academies')
        .insert({
          ...formData,
          owner_id: user.id,
          is_setup_complete: true
        })
        .select()
        .single();

      if (academyError) throw academyError;

      // Update user profile to link to the academy
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          academy_id: academy.id,
          role: 'owner'
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Mark setup steps as completed
      const setupSteps = ['basic_info', 'location', 'contact', 'branding', 'complete'];
      const { error: progressError } = await supabase
        .from('academy_setup_progress')
        .insert(
          setupSteps.map(step => ({
            academy_id: academy.id,
            step_completed: step,
            completed_by: user.id
          }))
        );

      if (progressError) throw progressError;

      toast({
        title: "Academy Setup Complete!",
        description: "Welcome to your new martial arts management platform."
      });

      // Navigate to dashboard
      navigate('/dashboard');

    } catch (error: any) {
      console.error('Setup error:', error);
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to complete academy setup",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Basic Information
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Academy Name *</Label>
              <Input
                id="name"
                placeholder="Dragon Martial Arts Academy"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe your academy, its mission, and what makes it special..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
              />
            </div>
          </div>
        );

      case 1: // Location Details
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Street Address *</Label>
              <Input
                id="address"
                placeholder="123 Main Street"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  placeholder="Your City"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  placeholder="CA"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zipcode">ZIP Code *</Label>
                <Input
                  id="zipcode"
                  placeholder="12345"
                  value={formData.zipcode}
                  onChange={(e) => handleInputChange('zipcode', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => handleInputChange('country', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USA">United States</SelectItem>
                    <SelectItem value="Canada">Canada</SelectItem>
                    <SelectItem value="UK">United Kingdom</SelectItem>
                    <SelectItem value="Australia">Australia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 2: // Contact Information
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                placeholder="(555) 123-4567"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="info@youracademy.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website_url">Website (Optional)</Label>
              <Input
                id="website_url"
                placeholder="https://youracademy.com"
                value={formData.website_url}
                onChange={(e) => handleInputChange('website_url', e.target.value)}
              />
            </div>
          </div>
        );

      case 3: // Branding & Colors
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold mb-2">Choose Your Academy Colors</h3>
              <p className="text-sm text-muted-foreground">
                These colors will be used throughout your academy's interface
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="primary_color">Primary Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    id="primary_color"
                    value={formData.primary_color}
                    onChange={(e) => handleInputChange('primary_color', e.target.value)}
                    className="w-12 h-12 rounded-lg border border-input cursor-pointer"
                  />
                  <Input
                    value={formData.primary_color}
                    onChange={(e) => handleInputChange('primary_color', e.target.value)}
                    placeholder="#3B82F6"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondary_color">Secondary Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    id="secondary_color"
                    value={formData.secondary_color}
                    onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                    className="w-12 h-12 rounded-lg border border-input cursor-pointer"
                  />
                  <Input
                    value={formData.secondary_color}
                    onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                    placeholder="#1E40AF"
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 p-4 border rounded-lg bg-muted/30">
              <h4 className="font-medium mb-3">Preview</h4>
              <div className="flex gap-3">
                <div 
                  className="w-8 h-8 rounded" 
                  style={{ backgroundColor: formData.primary_color }}
                />
                <div 
                  className="w-8 h-8 rounded" 
                  style={{ backgroundColor: formData.secondary_color }}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: formData.primary_color }}>
                    {formData.name || 'Your Academy Name'}
                  </p>
                  <p className="text-xs" style={{ color: formData.secondary_color }}>
                    Sample text in your colors
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 4: // Complete Setup
        return (
          <div className="text-center space-y-6">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2">Ready to Launch!</h3>
              <p className="text-muted-foreground">
                Your academy setup is complete. Click below to start managing your martial arts school.
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold">{formData.name}</h4>
              <p className="text-sm text-muted-foreground">{formData.city}, {formData.state}</p>
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  50 Students
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  30-Day Trial
                </span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Academy Setup</CardTitle>
          <CardDescription>
            Let's get your martial arts academy set up and ready to go
          </CardDescription>
          <div className="mt-4">
            <Progress value={progress} className="w-full" />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step Indicators */}
          <div className="flex justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center transition-colors
                    ${isCompleted 
                      ? 'bg-green-100 text-green-600' 
                      : isActive 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }
                  `}>
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="text-xs mt-1 text-center max-w-[80px]">
                    {step.title}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Step Content */}
          <div className="min-h-[300px]">
            {renderStepContent()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              Previous
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button onClick={nextStep} disabled={!validateStep(currentStep)}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={completeSetup} disabled={isLoading}>
                {isLoading ? 'Setting up...' : 'Complete Setup'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};