export const fieldTypes = [
  'text',
  'textarea',
  'email',
  'phone',
  'number',
  'url',
  'date',
  'choice',
  'multi',
  'dropdown',
  'rating',
  'scale',
  'file',
  'consent',
  'heading',
] as const;
export type FieldType = (typeof fieldTypes)[number];
export type Condition = { field: string; equals: string };
export type Field = {
  id: string;
  type: FieldType;
  label: string;
  description: string;
  required: boolean;
  options: string[];
  condition?: Condition;
  max: number;
};
export type Theme = 'paper' | 'studio' | 'bloom' | 'midnight' | 'confetti' | 'classic';
export type FormDefinition = {
  title: string;
  description: string;
  theme: Theme;
  accent: string;
  font: 'friendly' | 'clean' | 'serif';
  layout: 'page' | 'conversation';
  button: string;
  successTitle: string;
  successMessage: string;
  fields: Field[];
};
export type FormRecord = {
  id: string;
  owner_id?: string;
  draft: FormDefinition;
  status: 'draft' | 'published' | 'closed';
  published_version_id: string | null;
  created_at: string;
  updated_at: string;
  response_count?: number;
};
export type FileAnswer = { token: string; name: string; size: number; type: string };
export type Answer = string | number | boolean | string[] | FileAnswer;
export type Answers = Record<string, Answer>;
export type Submission = {
  id: string;
  form_id: string;
  version_id: string;
  answers: Answers;
  created_at: string;
  definition?: FormDefinition;
};
export type PublishedForm = {
  id: string;
  version_id: string;
  definition: FormDefinition;
  status: 'published' | 'closed';
};
