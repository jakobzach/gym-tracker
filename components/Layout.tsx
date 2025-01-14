import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Home, Dumbbell, ClipboardList, User } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { _supabase as supabase, getSession, refreshSession } from '../lib/supabase';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface LayoutProps {
  children: React.ReactNode;
  showBackButton?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, showBackButton = false }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      let session = await getSession();

      if (!session) {
        session = await refreshSession();
      }

      if (session) {
        const {
          data: { _user: user },
        } = await supabase.auth.getUser();
        setUser(user);
        setLoading(false);
      } else if (pathname !== '/auth/signin' && pathname !== '/auth/signup') {
        router.push('/auth/signin');
      } else {
        setLoading(false);
      }
    };

    checkSession();
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isAuthPage = pathname?.startsWith('/auth');
  if (isAuthPage) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-xl items-center">
          {showBackButton && (
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="flex items-center space-x-2">
            <Dumbbell className="h-5 w-5" />
            <h1 className="text-lg font-semibold">Gym Tracker</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 container max-w-screen-xl py-6">{children}</main>

      <nav className="sticky bottom-0 z-50 w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-screen-xl grid h-16 grid-cols-4 items-center px-4">
          <Link
            href="/dashboard"
            className={cn(
              'flex flex-col items-center justify-center py-2 hover:text-primary',
              pathname === '/dashboard' ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <Home className="h-5 w-5" />
            <span className="text-xs font-medium">Home</span>
          </Link>
          <Link
            href="/workouts"
            className={cn(
              'flex flex-col items-center justify-center py-2 hover:text-primary',
              pathname === '/workouts' ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <Dumbbell className="h-5 w-5" />
            <span className="text-xs font-medium">Workouts</span>
          </Link>
          <Link
            href="/plans"
            className={cn(
              'flex flex-col items-center justify-center py-2 hover:text-primary',
              pathname === '/plans' ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <ClipboardList className="h-5 w-5" />
            <span className="text-xs font-medium">Plans</span>
          </Link>
          <Link
            href="/account"
            className={cn(
              'flex flex-col items-center justify-center py-2 hover:text-primary',
              pathname === '/account' ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <User className="h-5 w-5" />
            <span className="text-xs font-medium">Account</span>
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default Layout;
