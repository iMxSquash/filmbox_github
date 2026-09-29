// Les résultats des missions sur le jeu de départ (base Docker fraîchement migrée).
// On vérifie des valeurs stables : aucun test n'écrit dans la base.
import { afterAll, describe, expect, it } from 'vitest'
import { brutContrePondere, longsMetrages, oscars, topParGenre, topTags } from '@/lib/db/classements'
import { lire } from '@/lib/db/lire'
import { catalogue, evolutionNotes, fiche, mieuxNotes, rechercher, tendances } from '@/lib/db/films'
import { carte, derniersVisionnages, plusActifs } from '@/lib/db/membres'
import { fermerPool } from '@/lib/db/pool'
import { acteurs, chemin, inaccessibles, nombreDeBacon, plusEloignes } from '@/lib/db/personnes'
import { episodes } from '@/lib/db/sagas'
import { parGenreEtTrimestre } from '@/lib/db/statistiques'

afterAll(fermerPool)

describe('catalogue (M2, M9, M10)', () => {
  it('M2.1 : la période 2000-2010 ne renvoie que ces années, du plus ancien au plus récent', async () => {
    const { films, total } = await catalogue({ anneeMin: 2000, anneeMax: 2010, tri: 'annee', page: 1 })
    expect(total).toBeGreaterThan(0)
    expect(films.every((f) => f.annee >= 2000 && f.annee <= 2010)).toBe(true)
    expect(films.map((f) => f.annee)).toEqual([...films.map((f) => f.annee)].sort((a, b) => a - b))
  })

  it('M9.1 / M10.1 : la fiche d\'Inception', async () => {
    const f = await fiche(12)
    expect(f).toMatchObject({ titre: 'Inception', annee: 2010, duree: '2 h 28', realisateurs: 'Christopher Nolan' })
    expect(f?.details.tags).toContain('rêves')
    expect(f?.note_ponderee).not.toBeNull()
  })

  it('M2.4 : les mieux notés ont au moins 5 notes', async () => {
    const top = await mieuxNotes()
    expect(top).toHaveLength(5)
    expect(top.every((f) => f.nb_notes >= 5)).toBe(true)
  })

  it('M6.2 : la moyenne cumulée termine sur la moyenne du film', async () => {
    const [evolution, f] = await Promise.all([evolutionNotes(12), fiche(12)])
    expect(evolution.at(-1)?.moyenne_cumulee).toBeCloseTo(f!.moyenne!, 1)
  })

  it('M16.3 : la recherche renvoie l\'id et ignore l\'injection', async () => {
    const dark = await rechercher('dark')
    expect(dark.map((r) => r.titre)).toEqual(['The Dark Knight', 'The Dark Knight Rises'])
    expect(dark.every((r) => Number.isInteger(r.id))).toBe(true)
    expect(await rechercher("x' OR '1'='1")).toEqual([])
  })

  it('M11.2 : les tendances s\'exécutent (plage de dates)', async () => {
    expect(Array.isArray(await tendances())).toBe(true)
  })
})

describe('sagas et Kevin Bacon (M4, M5.4)', () => {
  it('M4.2 : chaque saga est ordonnée par film_precedent_id', async () => {
    const tous = await episodes()
    const rvf = tous.filter((e) => e.saga === 'Retour vers le futur')
    expect(rvf.map((e) => e.titre)).toEqual(['Retour vers le futur', 'Retour vers le futur II', 'Retour vers le futur III'])
    expect(rvf.at(-1)?.parcours).toBe('Retour vers le futur -> Retour vers le futur II -> Retour vers le futur III')
    expect(new Set(tous.map((e) => e.saga)).size).toBe(3)
  })

  it('M4.3 : Anne Hathaway est à 3 degrés, Kevin Bacon à 0', async () => {
    const tous = await plusEloignes()
    expect(tous[0]?.nombre_de_bacon).toBe(4)
    const hathaway = (await acteurs()).find((a) => a.nom === 'Anne Hathaway')!
    expect(await nombreDeBacon(hathaway.id)).toBe(3)
    const bacon = (await acteurs()).find((a) => a.nom === 'Kevin Bacon')!
    expect(await nombreDeBacon(bacon.id)).toBe(0)
  })

  it('M4.4 : chemin le plus court vers Omar Sy', async () => {
    const omar = (await acteurs()).find((a) => a.nom === 'Omar Sy')!
    const trajet = await chemin(omar.id)
    expect(trajet?.chemin.startsWith('Kevin Bacon - ')).toBe(true)
    expect(trajet?.chemin.endsWith(' - Omar Sy')).toBe(true)
  })

  it('M4.5 : les acteurs de Retour vers le futur sont inaccessibles', async () => {
    const noms = (await inaccessibles()).map((p) => p.nom)
    expect(noms).toContain('Michael J. Fox')
    expect(noms).not.toContain('Tom Hanks')
  })
})

describe('classements et statistiques (M5, M7, M8, M10)', () => {
  it('M8.2 : les Oscars du meilleur film', async () => {
    expect((await oscars()).map((o) => o.titre)).toEqual(
      expect.arrayContaining(['Forrest Gump', 'Titanic', 'Les Infiltrés', 'The Artist']),
    )
  })

  it('M8.1 : plus de 2 h 30', async () => {
    const longs = await longsMetrages()
    expect(longs[0]?.titre).toBe('Titanic')
    expect(longs.every((f) => f.duree_min > 150)).toBe(true)
  })

  it('M8.3 : 5 tags au plus, du plus utilisé au moins utilisé', async () => {
    const tags = await topTags()
    expect(tags.length).toBeLessThanOrEqual(5)
    expect(tags.map((t) => t.nb_films)).toEqual([...tags.map((t) => t.nb_films)].sort((a, b) => b - a))
  })

  it('M5.1 : au plus 3 films par genre', async () => {
    const top = await topParGenre()
    const parGenre = Map.groupBy(top, (t) => t.genre)
    expect([...parGenre.values()].every((l) => l.length <= 3)).toBe(true)
  })

  it('M10.2 : la version ensembliste donne les valeurs de note_ponderee()', async () => {
    const top = await brutContrePondere()
    expect(top).toHaveLength(5)
    for (const film of top) {
      const [attendu] = await lire<{ n: number }>(null, 'SELECT note_ponderee($1)::float8 AS n', [film.id])
      expect(film.note_ponderee).toBeCloseTo(attendu!.n, 2)
    }
  })

  it('M7.3 : le total général égale la somme des sous-totaux par genre', async () => {
    const lignes = await parGenreEtTrimestre(null)
    const total = lignes.find((l) => l.genre === 'TOTAL')!.visionnages
    const sousTotaux = lignes.filter((l) => l.genre !== 'TOTAL' && l.trimestre === 'Année')
    expect(sousTotaux.reduce((s, l) => s + l.visionnages, 0)).toBe(total)
  })
})

describe('membres (M2.5, M3.1, M8.4, M11.1)', () => {
  it('M3.1 : la carte de cinephile_92, et un pseudo inconnu n\'a pas de carte', async () => {
    const c = await carte(null, 'cinephile_92')
    expect(c?.nb_films_notes).toBeGreaterThan(0)
    expect(c?.genre_prefere).not.toBeNull()
    expect(await carte(null, 'inconnu')).toBeNull()
  })

  it('M2.5 + M8.4 : au plus 2 derniers visionnages par membre', async () => {
    const membres = await plusActifs(null)
    expect(membres.length).toBeGreaterThan(0)
    expect(membres.every((m) => m.derniers.length <= 2)).toBe(true)
  })

  it('M11.1 + M16.2 : au plus 20 visionnages, aucune entrée privée d\'autrui', async () => {
    const vus = await derniersVisionnages(null, 'lea.reel')
    expect(vus.length).toBeLessThanOrEqual(20)
    expect(vus.some((v) => v.prive)).toBe(false)
  })
})
