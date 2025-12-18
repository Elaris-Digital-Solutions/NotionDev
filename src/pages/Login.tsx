import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [useMagicLink, setUseMagicLink] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (useMagicLink) {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast({
          title: "Check your email",
          description: "We sent you a magic link to sign in."
        });
      } else if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        if (error) throw error;

        // If email confirmation is enabled, session will be null.
        // If disabled (auto-confirm), session will be present.
        if (!data.session) {
          toast({ title: "Success", description: "Please check your email to confirm your account." });
        }
        // If session exists, AuthLayout will automatically redirect.
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            {isSignUp ? "Create an account" : (useMagicLink ? "Sign in with Magic Link" : "Welcome Back")}
          </CardTitle>
          <CardDescription className="text-center">
            {isSignUp
              ? "Enter your details to get started"
              : (useMagicLink ? "We'll send a link to your email" : "Enter your credentials to access your account")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {!useMagicLink && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={!useMagicLink}
                />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Loading...' : (
                useMagicLink ? 'Send Magic Link' : (isSignUp ? 'Sign Up' : 'Sign In')
              )}
            </Button>
          </form>

          <div className="mt-6 flex flex-col gap-2 text-center text-sm">
            {!isSignUp && (
              <Button
                variant="link"
                className="p-0 h-auto text-muted-foreground hover:text-foreground"
                onClick={() => setUseMagicLink(!useMagicLink)}
              >
                {useMagicLink ? "Sign in with password instead" : "Sign in with magic link instead"}
              </Button>
            )}

            <div>
              <span className="text-muted-foreground">
                {isSignUp ? "Already have an account? " : "Don't have an account? "}
              </span>
              <Button
                variant="link"
                className="p-0 h-auto font-semibold"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setUseMagicLink(false);
                }}
              >
                {isSignUp ? "Log In" : "Sign Up"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
