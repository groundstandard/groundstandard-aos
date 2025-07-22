import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAcademy } from '@/hooks/useAcademy';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import JoinAcademyForm from './JoinAcademyForm';

const AcademyWelcome = () => {
  const { user, profile } = useAuth();
  const { academy } = useAcademy();
  const [showJoinForm, setShowJoinForm] = useState(false);

  if (showJoinForm) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
        <JoinAcademyForm onBack={() => setShowJoinForm(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <Building2 className="h-16 w-16 text-primary mx-auto mb-4" />
          <CardTitle className="text-3xl font-bold">Welcome to Academy Manager</CardTitle>
          <CardDescription className="text-lg">
            Your complete martial arts academy management platform
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-muted-foreground mb-6">
              Get started by creating your academy or joining an existing one.
            </p>
          </div>
          
          <div className="grid gap-4">
            <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
              <Link to="/academy-setup" className="block">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">Create New Academy</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Set up your own martial arts academy with complete management tools.
                    </p>
                    <div className="flex items-center text-sm text-primary">
                      <span>Get started</span>
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </div>
                  </div>
                </div>
              </Link>
            </Card>
            
            <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div 
                className="flex items-start gap-4"
                onClick={() => setShowJoinForm(true)}
              >
                <div className="p-3 rounded-lg bg-secondary/10">
                  <Users className="h-6 w-6 text-secondary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Join Existing Academy</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Have an invitation code? Enter it here to join your academy.
                  </p>
                  <div className="flex items-center text-sm text-secondary">
                    <span>Enter invitation code</span>
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </div>
                </div>
              </div>
            </Card>
          </div>
          
          <div className="text-center pt-4">
            <p className="text-sm text-muted-foreground">
              Need help? Contact support at{' '}
              <span className="text-primary">support@academymanager.com</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AcademyWelcome;