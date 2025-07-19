import { Shield, Twitter, Github, Linkedin, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  const handleSocialClick = (platform: string) => {
    const urls = {
      twitter: "https://twitter.com/dojomaster",
      github: "https://github.com/dojomaster",
      linkedin: "https://linkedin.com/company/dojomaster",
      email: "mailto:contact@dojomaster.com"
    };
    window.open(urls[platform as keyof typeof urls], '_blank');
  };

  return (
    <footer className="bg-card/50 border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-secondary" />
              <span className="text-xl font-bold">DojoMaster</span>
            </div>
            <p className="text-muted-foreground">
              The complete platform for martial arts academy management. 
              Streamline operations and focus on what matters most - your students.
            </p>
            <div className="flex space-x-4">
              <Twitter 
                className="h-5 w-5 text-muted-foreground hover:text-secondary transition-colors cursor-pointer" 
                onClick={() => handleSocialClick('twitter')}
              />
              <Github 
                className="h-5 w-5 text-muted-foreground hover:text-secondary transition-colors cursor-pointer" 
                onClick={() => handleSocialClick('github')}
              />
              <Linkedin 
                className="h-5 w-5 text-muted-foreground hover:text-secondary transition-colors cursor-pointer" 
                onClick={() => handleSocialClick('linkedin')}
              />
              <Mail 
                className="h-5 w-5 text-muted-foreground hover:text-secondary transition-colors cursor-pointer" 
                onClick={() => handleSocialClick('email')}
              />
            </div>
          </div>
          
          {/* Product */}
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link to="/subscription" className="hover:text-foreground transition-colors">Features</Link></li>
              <li><Link to="/subscription" className="hover:text-foreground transition-colors">Pricing</Link></li>
              <li><span className="hover:text-foreground transition-colors cursor-pointer">Mobile Apps</span></li>
              <li><span className="hover:text-foreground transition-colors cursor-pointer">Integrations</span></li>
              <li><span className="hover:text-foreground transition-colors cursor-pointer">API</span></li>
            </ul>
          </div>
          
          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><span className="hover:text-foreground transition-colors cursor-pointer">Documentation</span></li>
              <li><span className="hover:text-foreground transition-colors cursor-pointer">Help Center</span></li>
              <li><span className="hover:text-foreground transition-colors cursor-pointer">Academy Blog</span></li>
              <li><span className="hover:text-foreground transition-colors cursor-pointer">Case Studies</span></li>
              <li><span className="hover:text-foreground transition-colors cursor-pointer">Webinars</span></li>
            </ul>
          </div>
          
          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><span className="hover:text-foreground transition-colors cursor-pointer">About Us</span></li>
              <li><span className="hover:text-foreground transition-colors cursor-pointer">Careers</span></li>
              <li><span className="hover:text-foreground transition-colors cursor-pointer">Contact</span></li>
              <li><span className="hover:text-foreground transition-colors cursor-pointer">Privacy Policy</span></li>
              <li><span className="hover:text-foreground transition-colors cursor-pointer">Terms of Service</span></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-muted-foreground text-sm">
            © 2024 DojoMaster. All rights reserved.
          </p>
          <div className="flex items-center space-x-6 mt-4 md:mt-0 text-sm text-muted-foreground">
            <span className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>SOC 2 Compliant</span>
            </span>
            <span>99.9% Uptime</span>
            <span>GDPR Ready</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;