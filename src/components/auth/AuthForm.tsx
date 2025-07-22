import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export const AuthForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'student' | 'staff'>('student');
  const [roleLoading, setRoleLoading] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: ""
  });
  const { toast } = useToast();

  // Load user's preferred role on component mount
  useEffect(() => {
    const loadPreferredRole = async () => {
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // User is logged in, get their preferred role
          const { data } = await supabase
            .from('user_preferences')
            .select('preferred_login_role')
            .eq('user_id', session.user.id)
            .single();
          
          if (data?.preferred_login_role) {
            setSelectedRole(data.preferred_login_role as 'student' | 'staff');
          }
        } else {
          // No session, check if there's a stored preference from anonymous user
          const storedRole = localStorage.getItem('preferred_login_role');
          if (storedRole === 'student' || storedRole === 'staff') {
            setSelectedRole(storedRole);
          }
        }
      } catch (error) {
        console.error('Error loading preferred role:', error);
      } finally {
        setRoleLoading(false);
      }
    };

    loadPreferredRole();
  }, []);

  // Save role preference when changed
  const handleRoleChange = async (role: 'student' | 'staff') => {
    setSelectedRole(role);
    
    try {
      // Always store in localStorage for anonymous users
      localStorage.setItem('preferred_login_role', role);
      
      // If user is logged in, also store in database
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase
          .from('user_preferences')
          .upsert({
            user_id: session.user.id,
            preferred_login_role: role
          });
      }
    } catch (error) {
      console.error('Error saving role preference:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Password Mismatch",
        description: "Passwords do not match"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            role: 'owner' // Staff users start as academy owners
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Account Created",
        description: "Please check your email to verify your account before signing in"
      });
      
      // Don't auto-navigate after signup - user needs to verify email first
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (error) {
        // Handle different error scenarios based on selected role
        if (error.message.includes('Invalid login credentials') || error.message.includes('User not found')) {
          if (selectedRole === 'staff') {
            toast({
              variant: "destructive",
              title: "Account Not Found",
              description: "No staff account found with these credentials. Would you like to create a new account?",
            });
          } else {
            toast({
              variant: "destructive",
              title: "Account Not Found",
              description: "No student account found. Please contact your academy administrator for access.",
            });
          }
        } else {
          throw error;
        }
        return;
      }

      // Save role preference for this user
      if (data.user) {
        await supabase
          .from('user_preferences')
          .upsert({
            user_id: data.user.id,
            preferred_login_role: selectedRole
          });
      }

      toast({
        title: "Welcome Back",
        description: "Successfully signed in"
      });
      
      // Navigate to dashboard - the routing will handle role-based redirection
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign In Failed",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <Card className="w-full max-w-md shadow-elegant border-0 bg-white">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-display text-primary">DojoMaster</CardTitle>
          <CardDescription>Access your martial arts academy</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Role Selection */}
          <div className="mb-6">
            <Label className="text-sm font-medium">I am a:</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Button
                type="button"
                variant={selectedRole === 'student' ? 'default' : 'outline'}
                onClick={() => handleRoleChange('student')}
                className="w-full"
                disabled={roleLoading}
              >
                Student Sign in
              </Button>
              <Button
                type="button"
                variant={selectedRole === 'staff' ? 'default' : 'outline'}
                onClick={() => handleRoleChange('staff')}
                className="w-full"
                disabled={roleLoading}
              >
                Staff
              </Button>
            </div>
          </div>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup" disabled={selectedRole === 'student'}>
                {selectedRole === 'student' ? 'Sign Up (Staff Only)' : 'Sign Up'}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              {selectedRole === 'student' ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    Student accounts are created by your academy administrator.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Please contact your academy for login credentials.
                  </p>
                </div>
              ) : (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signupEmail">Email</Label>
                  <Input
                    id="signupEmail"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signupPassword">Password</Label>
                  <Input
                    id="signupPassword"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
              </form>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};