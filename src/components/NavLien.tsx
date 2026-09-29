'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// La page courante est signalée par aria-current, pas seulement par la couleur.
export function NavLien({ href, children }: { href: string; children: React.ReactNode }) {
  const actif = usePathname() === href
  return (
    <Link href={href} aria-current={actif ? 'page' : undefined}>
      {children}
    </Link>
  )
}
