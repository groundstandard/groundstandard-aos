import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Zap, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Configurations() {
  const navigate = useNavigate();

  const configSections = [
    {
      title: 'Automations',
      description: 'Streamline academy operations with intelligent automation workflows',
      icon: Zap,
      path: '/automations',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Custom Fields',
      description: 'Create and manage custom fields for contacts and forms',
      icon: FileText,
      path: '/custom-fields',
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="flex items-start gap-2 sm:gap-4 mb-6 sm:mb-8">
          <BackButton />
          <div className="flex-1">
            <h1 className="text-xl sm:text-3xl font-bold text-foreground flex items-center gap-2 flex-wrap">
              <Settings className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <span className="break-words">Configurations</span>
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Manage academy settings and customizations
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {configSections.map((section) => {
            const Icon = section.icon;
            return (
              <Card 
                key={section.path}
                className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
                onClick={() => navigate(section.path)}
              >
                <CardHeader className="pb-4">
                  <div className={`w-12 h-12 rounded-lg ${section.bgColor} flex items-center justify-center mb-3`}>
                    <Icon className={`h-6 w-6 ${section.color}`} />
                  </div>
                  <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">
                    {section.title}
                  </CardTitle>
                  <CardDescription>
                    {section.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline" 
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  >
                    Manage {section.title}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}