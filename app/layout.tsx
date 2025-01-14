import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Gym Tracker',
  description: 'Track your workouts and progress',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}



import './globals.css'