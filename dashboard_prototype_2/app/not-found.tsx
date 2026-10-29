'use client'

import Topbar from '@/components/dashboard/Topbar'
import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="dashboard" id="main-content">
      <Topbar />
      <h1>Page not found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <p>
        <Link href="/" className="footer-link">Back to Dashboard</Link>
      </p>
      <footer>
        <Link href="/help" className="footer-link">Help</Link>
        <span>
          India&apos;s National Disaster &amp; Risk Analytics <b>◆</b>
        </span>
      </footer>
    </main>
  )
}