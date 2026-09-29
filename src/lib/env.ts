import 'server-only'
import { z } from 'zod'

const schema = z.object({
  DATABASE_URL: z.url(),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET : 32 caractères minimum'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
})

let cache: z.infer<typeof schema> | undefined

// Lecture paresseuse : un build sans .env ne plante pas, le premier usage réel oui.
export function env() {
  if (!cache) {
    cache = schema.parse(process.env)
  }
  return cache
}
