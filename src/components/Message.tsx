// Message d'état : icône + texte, jamais la couleur seule. Erreur = alert, succès = status.
export function Message({
  type,
  id,
  children,
}: {
  type: 'erreur' | 'succes'
  id?: string
  children: React.ReactNode
}) {
  return (
    <p id={id} role={type === 'erreur' ? 'alert' : 'status'} className={`message message-${type}`}>
      <span aria-hidden="true">{type === 'erreur' ? '⚠' : '✓'}</span>
      <span>{children}</span>
    </p>
  )
}
