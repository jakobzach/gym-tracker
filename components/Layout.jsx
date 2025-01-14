import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { HomeIcon, Dumbbell, ClipboardList, UserCircle2 } from 'lucide-react'

export default function Layout({ children }) {
  const router = useRouter()
  const [isAuthScreen, setIsAuthScreen] = useState(false)

  useEffect(() => {
    setIsAuthScreen(router.pathname.startsWith('/auth/'))
  }, [router.pathname])

  const navItems = [
    { href: '/dashboard', icon: HomeIcon, label: 'Home' },
    { href: '/plans', icon: ClipboardList, label: 'Plans' },
    { href: '/workouts', icon: Dumbbell, label: 'Workouts' },
    { href: '/account', icon: UserCircle2, label: 'Account' },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 flex h-14 items-center">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl">Gym Tracker</span>
          </Link>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="mx-auto max-w-4xl">
          {children}
        </div>
      </main>
      {!isAuthScreen && (
        <footer className="sticky bottom-0 z-50 w-full bg-white border-t">
          <nav className="container mx-auto px-4 flex h-16 items-center justify-around">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center w-full h-full ${
                  router.pathname === item.href
                    ? 'text-blue-500'
                    : 'text-gray-500'
                }`}
              >
                <item.icon className="h-6 w-6" />
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            ))}
          </nav>
        </footer>
      )}
    </div>
  )
}

