import { describe, expect, it } from 'vitest'
import { creerJeton, lireJeton } from '@/lib/session'

const membre = { membreId: 5, pseudo: 'lea.reel' }

describe('jeton de session', () => {
  it('relit une session valide', () => {
    expect(lireJeton(creerJeton(membre))).toEqual(membre)
  })

  it('refuse un jeton expiré', () => {
    const jeton = creerJeton(membre, Date.now() - 8 * 24 * 3600 * 1000)
    expect(lireJeton(jeton)).toBeNull()
  })

  it('refuse un contenu modifié (changement de membre)', () => {
    const [donnees, signature] = creerJeton(membre).split('.')
    const contenu = JSON.parse(Buffer.from(donnees!, 'base64url').toString())
    const falsifie = Buffer.from(JSON.stringify({ ...contenu, membreId: 1 })).toString('base64url')
    expect(lireJeton(`${falsifie}.${signature}`)).toBeNull()
  })

  it('refuse une signature modifiée ou des jetons mal formés', () => {
    const jeton = creerJeton(membre)
    expect(lireJeton(`${jeton}x`)).toBeNull()
    expect(lireJeton('')).toBeNull()
    expect(lireJeton('abc')).toBeNull()
    expect(lireJeton('a.b.c')).toBeNull()
  })
})
