import { Navigation } from "@/components/Navigation";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Pricing from "@/components/Pricing";
import Footer from "@/components/Footer";
import { AuthForm } from "@/components/auth/AuthForm";
import { useAuth } from "@/hooks/useAuth";
import { useAcademy } from "@/hooks/useAcademy";
import { Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StudentAcademySelector } from "@/components/academy/StudentAcademySelector";

const Index = () => {
  const { user, profile, userAcademies, loading: authLoading } = useAuth();
  const { academy, loading: academyLoading } = useAcademy();
  const [showLogin, setShowLogin] = useState(false);
  const [showAcademySelector, setShowAcademySelector] = useState(false);

  // Clear the localStorage flag on page load to always show student selector for testing
  useEffect(() => {
    localStorage.removeItem('student_academy_selected');
  }, []);

  // Show loading while auth is being determined
  if (authLoading || (user && academyLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, determine where to redirect them
  if (user && profile) {
    // Check if user has student academies and should show student selector
    const studentAcademies = userAcademies.filter(academy => academy.role === 'student');
    
    console.log('Index.tsx - User academies:', userAcademies);
    console.log('Index.tsx - Student academies:', studentAcademies);
    console.log('Index.tsx - Student academy selected:', localStorage.getItem('student_academy_selected'));
    
    // Show student selector when user has multiple student roles and hasn't selected one yet
    if (studentAcademies.length > 1 && !localStorage.getItem('student_academy_selected')) {
      return (
        <StudentAcademySelector 
          onAcademySelected={() => {
            console.log('Index.tsx - Academy selected, setting localStorage flag');
            localStorage.setItem('student_academy_selected', 'true');
          }} 
          studentAcademies={studentAcademies}
        />
      );
    }

    // If user has only one student academy, auto-select it
    if (studentAcademies.length === 1 && !localStorage.getItem('student_academy_selected')) {
      localStorage.setItem('student_academy_selected', 'true');
      // Auto-select the single academy and redirect to dashboard
      return <Navigate to="/dashboard" replace />;
    }

    // Check if user has both student and staff roles
    const staffAcademies = userAcademies.filter(academy => academy.role !== 'student');
    
    // If user has staff roles and no student academies, proceed with normal academy logic
    if (staffAcademies.length > 0 && studentAcademies.length === 0) {
      // If user has no academies, redirect to academy setup
      if (userAcademies.length === 0) {
        return <Navigate to="/academy-setup" replace />;
      }
      
      // If user has academies but no current academy is loaded, redirect to setup
      if (!academy) {
        return <Navigate to="/academy-setup" replace />;
      }
      
      // If academy is loaded but not fully set up, redirect to setup
      if (academy && !academy.is_setup_complete) {
        return <Navigate to="/academy-setup" replace />;
      }
      
      // If academy is loaded and set up, redirect to dashboard
      if (academy && academy.is_setup_complete) {
        return <Navigate to="/dashboard" replace />;
      }
    }

    // If user has selected a student academy, redirect to dashboard
    if (studentAcademies.length > 0 && localStorage.getItem('student_academy_selected')) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {showLogin ? (
        <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
              <CardDescription>
                Sign in to access your academy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AuthForm />
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Don't have an academy?{" "}
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-primary hover:underline"
                    onClick={() => setShowLogin(false)}
                  >
                    Create one here
                  </Button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          <Hero onLoginClick={() => setShowLogin(true)} onSignUpClick={() => setShowLogin(false)} />
          <Features />
          <Pricing />
          <Footer />
        </>
      )}
    </div>
  );
};

export default Index;
