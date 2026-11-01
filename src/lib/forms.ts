import { z } from 'zod';
import { fieldTypes, type Field, type FormDefinition, type Answers, type FieldType } from './types';

export const fieldInfo: Record<FieldType, { label: string; hint: string; symbol: string }> = {
  text: { label: 'Short answer', hint: 'A name, a thought, a little something', symbol: 'Aa' },
  textarea: { label: 'Long answer', hint: 'Give them room to tell their story', symbol: '¶' },
  email: { label: 'Email address', hint: 'Stay in touch', symbol: '@' },
  phone: { label: 'Phone number', hint: 'A number you can reach', symbol: '#' },
  number: { label: 'Number', hint: 'Count the things that count', symbol: '123' },
  url: { label: 'Website', hint: 'A link to their corner of the internet', symbol: '↗' },
  date: { label: 'Date', hint: 'Make a date of it', symbol: '31' },
  choice: { label: 'Multiple choice', hint: 'Pick a favorite', symbol: '◉' },
  multi: { label: 'Checkboxes', hint: 'More than one good answer', symbol: '☑' },
  dropdown: { label: 'Dropdown', hint: 'A tidy list of possibilities', symbol: '⌄' },
  rating: { label: 'Star rating', hint: 'A little appreciation goes a long way', symbol: '☆' },
  scale: { label: 'Opinion scale', hint: 'From not quite to absolutely', symbol: '1–10' },
  file: { label: 'File upload', hint: 'Pictures, PDFs, and bright ideas', symbol: '↥' },
  consent: { label: 'Consent', hint: 'A clear yes, please', symbol: '✓' },
  heading: { label: 'Section heading', hint: 'A breath between questions', symbol: 'H' },
};
export const themes = [
  {
    id: 'paper',
    name: 'Sunday paper',
    bg: '#faf8f0',
    ink: '#272923',
    accent: '#ebc94e',
    description: 'A little handmade. A lot of heart.',
  },
  {
    id: 'studio',
    name: 'Studio',
    bg: '#edf0e9',
    ink: '#253e35',
    accent: '#bad5a6',
    description: 'Calm, collected, and considered.',
  },
  {
    id: 'bloom',
    name: 'After hours',
    bg: '#faeae7',
    ink: '#722e38',
    accent: '#efa1ac',
    description: 'A warm welcome, in full bloom.',
  },
  {
    id: 'midnight',
    name: 'Midnight club',
    bg: '#242c2e',
    ink: '#f4f1df',
    accent: '#cae879',
    description: 'Big ideas don’t have a bedtime.',
  },
  {
    id: 'confetti',
    name: 'Good company',
    bg: '#efeafd',
    ink: '#41335f',
    accent: '#bca5e8',
    description: 'For your most colorful questions.',
  },
  {
    id: 'classic',
    name: 'The professional',
    bg: '#ffffff',
    ink: '#1e293b',
    accent: '#acd0f3',
    description: 'All business. Still human.',
  },
] as const;
export const uid = () => crypto.randomUUID();
export function makeField(type: FieldType, label?: string): Field {
  return {
    id: uid(),
    type,
    label:
      label ||
      (
        {
          text: 'What’s your name?',
          email: 'Your email address',
          choice: 'What brings you here?',
          rating: 'How was your experience?',
          consent: 'I agree to share my answers with the form owner.',
          heading: 'A little more about you',
        } as Partial<Record<FieldType, string>>
      )[type] ||
      fieldInfo[type].label,
    description: '',
    required: type !== 'heading',
    options: ['Option 1', 'Option 2', 'Option 3'],
    max: type === 'scale' ? 10 : 5,
  };
}
export function blankForm(): FormDefinition {
  return {
    title: 'Your next great form',
    description: 'Every good conversation starts with a question.',
    theme: 'paper',
    accent: '#ebc94e',
    font: 'friendly',
    layout: 'page',
    button: 'Send it my way',
    successTitle: 'You made our day.',
    successMessage: 'Your response is in. Thanks for sharing a little of yourself.',
    fields: [makeField('text'), makeField('email')],
  };
}
const conditionSchema = z.object({ field: z.string().uuid(), equals: z.string().max(500) });
export const definitionSchema = z
  .object({
    title: z.string().trim().min(1, 'Give your form a title.').max(160),
    description: z.string().max(2000),
    theme: z.enum(['paper', 'studio', 'bloom', 'midnight', 'confetti', 'classic']),
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    font: z.enum(['friendly', 'clean', 'serif']),
    layout: z.enum(['page', 'conversation']),
    button: z.string().trim().min(1).max(60),
    successTitle: z.string().min(1).max(160),
    successMessage: z.string().max(2000),
    fields: z
      .array(
        z.object({
          id: z.string().uuid(),
          type: z.enum(fieldTypes),
          label: z.string().trim().min(1).max(500),
          description: z.string().max(2000),
          required: z.boolean(),
          options: z.array(z.string().trim().min(1).max(200)).max(50),
          condition: conditionSchema.optional(),
          max: z.number().int().min(2).max(10),
        }),
      )
      .min(1)
      .max(100),
  })
  .superRefine((def, ctx) => {
    const seen = new Set<string>();
    def.fields.forEach((f, i) => {
      if (seen.has(f.id))
        ctx.addIssue({
          code: 'custom',
          path: ['fields', i],
          message: 'Question IDs must be unique.',
        });
      if (f.condition && !seen.has(f.condition.field))
        ctx.addIssue({
          code: 'custom',
          path: ['fields', i],
          message: 'Conditions must refer to an earlier question.',
        });
      if (
        ['choice', 'multi', 'dropdown'].includes(f.type) &&
        (f.options.length < 2 || new Set(f.options).size !== f.options.length)
      )
        ctx.addIssue({
          code: 'custom',
          path: ['fields', i],
          message: 'Add at least two unique choices.',
        });
      seen.add(f.id);
    });
    if (!def.fields.some((f) => f.type !== 'heading'))
      ctx.addIssue({ code: 'custom', message: 'Add at least one question.' });
  });
export function visibleFields(def: FormDefinition, answers: Answers): Field[] {
  const visible = new Set<string>();
  return def.fields.filter((f) => {
    const value = f.condition ? answers[f.condition.field] : undefined;
    const show =
      !f.condition ||
      (visible.has(f.condition.field) &&
        (Array.isArray(value)
          ? value.includes(f.condition.equals)
          : String(value ?? '') === f.condition.equals));
    if (show) visible.add(f.id);
    return show;
  });
}
export function safeFileName(name: string) {
  return (
    name.trim().length > 0 && !['.', '..'].includes(name) && !/[\u0000-\u001f\u007f\\/]/.test(name)
  );
}
const fileAnswerSchema = z
  .object({
    token: z.string().uuid(),
    name: z.string().min(1).max(240).refine(safeFileName, 'Choose a file with a valid filename.'),
    size: z
      .number()
      .int()
      .positive()
      .max(5 * 1024 * 1024),
    type: z.string().max(100),
  })
  .strict();
export function validateAnswers(
  def: FormDefinition,
  input: unknown,
): { answers: Answers; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const clean: Answers = {};
  const raw = (
    typeof input === 'object' && input !== null && !Array.isArray(input) ? input : {}
  ) as Answers;
  for (const f of visibleFields(def, raw)) {
    if (f.type === 'heading') continue;
    const a = raw[f.id];
    const empty =
      a === undefined ||
      a === null ||
      a === '' ||
      (Array.isArray(a) && a.length === 0) ||
      (f.type === 'consent' && a !== true);
    if (empty) {
      if (f.required) errors[f.id] = 'Please answer this question.';
      continue;
    }
    let valid = true;
    switch (f.type) {
      case 'text':
      case 'textarea':
        valid =
          typeof a === 'string' &&
          a.trim().length > 0 &&
          a.length <= (f.type === 'textarea' ? 10000 : 1000);
        break;
      case 'email':
        valid = typeof a === 'string' && z.email().max(254).safeParse(a).success;
        break;
      case 'phone':
        valid = typeof a === 'string' && /^[+\d\s().-]{6,30}$/.test(a);
        break;
      case 'url': {
        try {
          const u = new URL(String(a));
          valid =
            typeof a === 'string' && ['https:', 'http:'].includes(u.protocol) && a.length <= 2000;
        } catch {
          valid = false;
        }
        break;
      }
      case 'date': {
        const d = String(a);
        valid =
          typeof a === 'string' &&
          /^\d{4}-\d{2}-\d{2}$/.test(d) &&
          !Number.isNaN(Date.parse(d)) &&
          new Date(d).toISOString().slice(0, 10) === d;
        break;
      }
      case 'number':
        valid = typeof a === 'number' && Number.isFinite(a) && Math.abs(a) <= 1e15;
        break;
      case 'choice':
      case 'dropdown':
        valid = typeof a === 'string' && f.options.includes(a);
        break;
      case 'multi':
        valid =
          Array.isArray(a) &&
          a.length <= f.options.length &&
          new Set(a).size === a.length &&
          a.every((v) => typeof v === 'string' && f.options.includes(v));
        break;
      case 'rating':
      case 'scale':
        valid = typeof a === 'number' && Number.isInteger(a) && a >= 1 && a <= f.max;
        break;
      case 'file':
        valid = fileAnswerSchema.safeParse(a).success;
        break;
      case 'consent':
        valid = a === true;
        break;
    }
    if (valid) clean[f.id] = a;
    else
      errors[f.id] =
        (
          {
            email: 'Enter a valid email address.',
            url: 'Enter a full http:// or https:// link.',
            file: 'Choose a supported file up to 5 MB.',
            phone: 'Enter a valid phone number.',
            date: 'Choose a valid date.',
          } as Record<string, string>
        )[f.type] || 'Please enter a valid answer.';
  }
  return { answers: clean, errors };
}
export function csvCell(value: unknown): string {
  let s =
    typeof value === 'object' && value !== null
      ? 'name' in value
        ? String((value as { name: string }).name)
        : JSON.stringify(value)
      : String(value ?? '');
  if (/^[\s\u0000-\u001f\u007f-\u009f]*[=+@\-＝＋－＠]|^[\t\r\n]/.test(s)) s = "'" + s;
  return '"' + s.replaceAll('"', '""') + '"';
}
export const allowedMime = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'text/plain',
];
export const formatDate = (date: string) =>
  new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
export function contrastText(hex: string) {
  const rgb = hex
    .replace('#', '')
    .match(/.{2}/g)
    ?.map((c) => parseInt(c, 16) / 255) || [1, 1, 1];
  const [r, g, b] = rgb.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return l > 0.179 ? '#20251d' : '#fffefa';
}
