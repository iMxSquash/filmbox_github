import { afterEach, describe, expect, it, vi } from 'vitest'
import { messageUtilisateur } from '@/lib/erreurs'

const erreurPg = (code: string, message: string) => Object.assign(new Error(message), { code })

describe('messageUtilisateur', () => {
  afterEach(() => vi.restoreAllMocks())

  it('reprend les messages des procédures FilmBox (P0001)', () => {
    const e = erreurPg('P0001', 'Note invalide : 6 (de 0,5 à 5, par demi-point)')
    expect(messageUtilisateur(e)).toBe('Note invalide : 6 (de 0,5 à 5, par demi-point)')
  })

  it('traduit droit manquant et RLS violée (42501)', () => {
    const e = erreurPg('42501', 'new row violates row-level security policy for table "journal"')
    expect(messageUtilisateur(e)).toBe("Vous n'avez pas le droit d'effectuer cette action.")
  })

  it('traduit la clé étrangère (23503) sans exposer le SQL', () => {
    const e = erreurPg('23503', 'insert or update on table "journal" violates foreign key constraint')
    expect(messageUtilisateur(e)).toBe("L'élément demandé n'existe pas.")
  })

  it('traduit conflit de sérialisation et interblocage', () => {
    expect(messageUtilisateur(erreurPg('40001', 'x'))).toMatch(/réessayer/)
    expect(messageUtilisateur(erreurPg('40P01', 'x'))).toMatch(/réessayer/)
  })

  it("n'expose rien d'une erreur inconnue et la journalise côté serveur", () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const e = new Error('relation "secret" does not exist')
    expect(messageUtilisateur(e)).toBe('Une erreur est survenue, veuillez réessayer.')
    expect(log).toHaveBeenCalledWith(e)
  })
})
