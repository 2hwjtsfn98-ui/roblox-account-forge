import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MessageSquare, Shield, Zap } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-5xl font-bold mb-6">
            Chat Platform with Privacy & AI Moderation
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            A free Discord-like platform with all core features, stronger privacy (E2EE), and built-in AI moderation.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg">Get Started</Button>
            </Link>
            <Link to="/admin">
              <Button size="lg" variant="outline">Admin Login</Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="p-6 border border-border rounded-lg">
            <MessageSquare className="h-12 w-12 mb-4 text-primary" />
            <h3 className="text-xl font-semibold mb-2">Real-Time Chat</h3>
            <p className="text-muted-foreground">
              Instant messaging in servers, channels, and DMs with typing indicators.
            </p>
          </div>
          <div className="p-6 border border-border rounded-lg">
            <Shield className="h-12 w-12 mb-4 text-primary" />
            <h3 className="text-xl font-semibold mb-2">End-to-End Encryption</h3>
            <p className="text-muted-foreground">
              Your DMs are encrypted for maximum privacy and security.
            </p>
          </div>
          <div className="p-6 border border-border rounded-lg">
            <Zap className="h-12 w-12 mb-4 text-primary" />
            <h3 className="text-xl font-semibold mb-2">AI Moderation</h3>
            <p className="text-muted-foreground">
              Automated content moderation to keep communities safe.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
