import Link from 'next/link'

export function Pagination({
  page,
  total,
  taille,
  href,
}: {
  page: number
  total: number
  taille: number
  href: (page: number) => string
}) {
  const pages = Math.max(1, Math.ceil(total / taille))
  if (pages === 1) return null
  return (
    <nav aria-label="Pagination" className="pagination">
      {page > 1 ? <Link href={href(page - 1)}>Page précédente</Link> : <span />}
      <span>
        Page {page} sur {pages}
      </span>
      {page < pages ? <Link href={href(page + 1)}>Page suivante</Link> : <span />}
    </nav>
  )
}
