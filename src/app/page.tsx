import { getSession } from '@/lib/session'

export default async function Accueil() {
  const session = await getSession()

  return (
    <>
      <h1>FilmBox</h1>
      <p>
        {session
          ? `Bienvenue ${session.pseudo}.`
          : 'Le catalogue, les notes et le journal des cinéphiles.'}
      </p>
    </>
  )
}
