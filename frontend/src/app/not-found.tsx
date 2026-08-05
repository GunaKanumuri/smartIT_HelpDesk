import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0A0E1A] flex flex-col items-center justify-center p-6 text-center">
      <div className="relative mb-8">
        <h1 className="text-[12rem] font-bold text-white/5 select-none leading-none">404</h1>
        <div className="absolute inset-0 flex items-center justify-center">
          <Search className="w-24 h-24 text-teal-500 animate-pulse" />
        </div>
      </div>

      <h2 className="text-3xl font-bold text-white mb-4">Ticket Not Found</h2>
      <p className="text-gray-400 max-w-md mb-8">
        The page you are looking for doesn't exist or has been moved.
        Maybe our AI already archived it?
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/">
          <Button className="bg-teal-500 hover:bg-teal-400 text-white px-8">
            Back to Home
          </Button>
        </Link>
        <Link href="/login">
          <Button variant="outline" className="border-white/10 text-gray-300 hover:bg-white/5">
            Admin Login
          </Button>
        </Link>
      </div>
    </div>
  )
}
