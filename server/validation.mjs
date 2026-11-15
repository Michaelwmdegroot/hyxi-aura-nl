import { z } from 'zod';

const clean = z.string().trim();
const line = max => clean.max(max).refine(value => !/[\r\n\u0000-\u0008\u000b-\u001f]/.test(value), 'Gebruik één regel tekst.');
const optionalUtm = line(120).optional();

export const leadSchema = z.object({
  fullName: line(100).min(2, 'Vul je naam in.').refine(value => /\p{L}/u.test(value), 'Vul je naam in.'),
  email: clean.max(254).email('Vul een geldig e-mailadres in.').transform(value => value.toLowerCase()),
  phone: line(25).min(8, 'Vul een telefoonnummer in.').refine(value => /^(?:\+|00)?[\d ()-]+$/.test(value) && value.replace(/\D/g, '').length >= 9 && value.replace(/\D/g, '').length <= 15, 'Controleer je telefoonnummer.'),
  postcode: clean.regex(/^[1-9]\d{3}\s?[a-zA-Z]{2}$/, 'Vul een Nederlandse postcode in.').transform(value => value.replace(/\s/g, '').toUpperCase()),
  consent: z.literal(true, { error: 'Bevestig dat we je over deze aanvraag mogen benaderen.' }),
  intent: z.literal('quote').optional(),
  projectDetails: z.string().trim().max(1000).refine(value=> !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value),'Verwijder ongeldige tekens.').optional(),
  profile: z.object({
    solar: z.enum(['yes', 'planned', 'no']),
    annualUsage: z.number().int().min(500).max(100000).nullable(),
    goal: z.enum(['solar', 'prices', 'backup', 'unsure']),
    phase: z.enum(['single', 'three', 'unknown']),
    moduleType: z.union([z.literal(7), z.literal(9)]),
    moduleCount: z.number().int().min(1).max(6),
  }).strict(),
  attribution: z.object({
    utm_source: optionalUtm,
    utm_medium: optionalUtm,
    utm_campaign: optionalUtm,
  }).strict().optional(),
  website: line(200).optional().default(''),
}).strict();

export function validateLead(input) {
  const result = leadSchema.safeParse(input);
  if (result.success) return result;
  const fields = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (typeof field === 'string' && !fields[field]) fields[field] = issue.message;
  }
  return { success: false, fields };
}
