import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Home, Dumbbell, ClipboardList, User } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase as supabase, getSession, refreshSession } from '../lib/supabase';
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
          data: { user: user },
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

      <nav className="sticky bottom-0 z-50 w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-area-bottom">
        <div className="container max-w-screen-xl h-16 grid grid-cols-4 items-center px-4 md:px-6">
          <Link
            href="/dashboard"
            className={cn(
              'group relative flex flex-col items-center justify-center space-y-1 py-1',
              pathname === '/dashboard' ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <Home
              className={cn(
                'h-5 w-5 transition-all duration-200 ease-in-out',
                pathname === '/dashboard' ? 'scale-110' : 'group-hover:scale-110'
              )}
            />
            <span
              className={cn(
                'text-xs font-medium transition-all duration-200 leading-none',
                pathname === '/dashboard'
                  ? 'translate-y-0.5 opacity-100'
                  : 'opacity-70 group-hover:opacity-100 group-hover:translate-y-0.5'
              )}
            >
              Home
            </span>
          </Link>
          <Link
            href="/workouts"
            className={cn(
              'group relative flex flex-col items-center justify-center space-y-1 py-1',
              pathname === '/workouts' ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <Dumbbell
              className={cn(
                'h-5 w-5 transition-all duration-200 ease-in-out',
                pathname === '/workouts' ? 'scale-110' : 'group-hover:scale-110'
              )}
            />
            <span
              className={cn(
                'text-xs font-medium transition-all duration-200 leading-none',
                pathname === '/workouts'
                  ? 'translate-y-0.5 opacity-100'
                  : 'opacity-70 group-hover:opacity-100 group-hover:translate-y-0.5'
              )}
            >
              Workouts
            </span>
          </Link>
          <Link
            href="/plans"
            className={cn(
              'group relative flex flex-col items-center justify-center space-y-1 py-1',
              pathname === '/plans' ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <ClipboardList
              className={cn(
                'h-5 w-5 transition-all duration-200 ease-in-out',
                pathname === '/plans' ? 'scale-110' : 'group-hover:scale-110'
              )}
            />
            <span
              className={cn(
                'text-xs font-medium transition-all duration-200 leading-none',
                pathname === '/plans'
                  ? 'translate-y-0.5 opacity-100'
                  : 'opacity-70 group-hover:opacity-100 group-hover:translate-y-0.5'
              )}
            >
              Plans
            </span>
          </Link>
          <Link
            href="/account"
            className={cn(
              'group relative flex flex-col items-center justify-center space-y-1 py-1',
              pathname === '/account' ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <User
              className={cn(
                'h-5 w-5 transition-all duration-200 ease-in-out',
                pathname === '/account' ? 'scale-110' : 'group-hover:scale-110'
              )}
            />
            <span
              className={cn(
                'text-xs font-medium transition-all duration-200 leading-none',
                pathname === '/account'
                  ? 'translate-y-0.5 opacity-100'
                  : 'opacity-70 group-hover:opacity-100 group-hover:translate-y-0.5'
              )}
            >
              Account
            </span>
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default Layout;
