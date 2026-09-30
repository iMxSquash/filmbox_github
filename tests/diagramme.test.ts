import { describe, expect, it } from 'vitest'
import { largeur } from '@/lib/diagramme'

describe('largeur d\'une barre', () => {
  it('est proportionnelle à la valeur', () => {
    expect(largeur(2.5, 5)).toBe(50)
    expect(largeur(5, 5)).toBe(100)
  })

  it('reste dans la piste : bornée à 0 et 100, sans division par zéro', () => {
    expect(largeur(-1, 5)).toBe(0)
    expect(largeur(9, 5)).toBe(100)
    expect(largeur(3, 0)).toBe(0)
  })
})
