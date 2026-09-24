'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navigation() {
  const pathname = usePathname()

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/analysis', label: 'Analysis' },
  ]

  return (
    <nav className="main-nav">
      {navItems.map(item => (
        <Link
          key={item.href}
          href={item.href}
          className={`nav-item ${pathname === item.href ? 'active' : ''}`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
