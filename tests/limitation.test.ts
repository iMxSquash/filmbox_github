import { describe, expect, it } from 'vitest'
import { enregistrerEchec, reinitialiser, tentativesAutorisees } from '@/lib/limitation'

describe('limitation des tentatives', () => {
  it('bloque après 5 échecs puis libère après la fenêtre', () => {
    const cle = 'ip|test-blocage'
    const t0 = 1_000_000
    for (let i = 0; i < 5; i++) {
      expect(tentativesAutorisees(cle, t0)).toBe(true)
      enregistrerEchec(cle, t0)
    }
    expect(tentativesAutorisees(cle, t0)).toBe(false)
    expect(tentativesAutorisees(cle, t0 + 16 * 60 * 1000)).toBe(true)
  })

  it('une connexion réussie remet le compteur à zéro', () => {
    const cle = 'ip|test-reset'
    for (let i = 0; i < 5; i++) enregistrerEchec(cle)
    reinitialiser(cle)
    expect(tentativesAutorisees(cle)).toBe(true)
  })

  it('les clés sont indépendantes', () => {
    for (let i = 0; i < 5; i++) enregistrerEchec('ip|a')
    expect(tentativesAutorisees('ip|b')).toBe(true)
  })
})
