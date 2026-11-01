import { blankForm, makeField } from './forms';
import type { FormDefinition, Theme } from './types';
type Template = {
  id: string;
  name: string;
  category: string;
  description: string;
  theme: Theme;
  symbol: string;
  build: () => FormDefinition;
};
function base(title: string, description: string, theme: Theme): FormDefinition {
  return { ...blankForm(), title, description, theme };
}
export const templates: Template[] = [
  {
    id: 'event',
    name: 'Good people, great plans.',
    category: 'Events',
    description: 'RSVPs for your next get-together.',
    theme: 'paper',
    symbol: '✳',
    build: () => ({
      ...base(
        'Good people, great plans.',
        'We’re getting together. We’d love to see you there.',
        'paper',
      ),
      fields: [
        makeField('text', 'First things first. What’s your name?'),
        makeField('email', 'Where can we send the details?'),
        {
          ...makeField('choice', 'Count you in?'),
          options: ['Wouldn’t miss it', 'Maybe, keep me posted', 'Sitting this one out'],
        },
        { ...makeField('number', 'How many friends are coming along?'), required: false },
        { ...makeField('textarea', 'Any dietary needs or little notes?'), required: false },
      ],
    }),
  },
  {
    id: 'feedback',
    name: 'A penny for your thoughts.',
    category: 'Feedback',
    description: 'Honest feedback. Better experiences.',
    theme: 'studio',
    symbol: '☆',
    build: () => ({
      ...base(
        'A penny for your thoughts.',
        'The good, the could-be-better, and everything in between. We’re listening.',
        'studio',
      ),
      fields: [
        makeField('rating', 'How did we do?'),
        {
          ...makeField('choice', 'What stood out?'),
          options: ['The people', 'The experience', 'The little details', 'Something else'],
        },
        makeField('textarea', 'Tell us a little more.'),
        { ...makeField('email', 'Can we follow up?'), required: false },
      ],
    }),
  },
  {
    id: 'student',
    name: 'Big ideas start here.',
    category: 'Education',
    description: 'A home for your research questions.',
    theme: 'confetti',
    symbol: '↗',
    build: () => ({
      ...base(
        'Big ideas start here.',
        'Help us understand a little more about student life. It only takes a minute.',
        'confetti',
      ),
      fields: [
        makeField('text', 'What should we call you?'),
        {
          ...makeField('dropdown', 'What year are you in?'),
          options: ['First year', 'Second year', 'Third year', 'Fourth year', 'Postgraduate'],
        },
        {
          ...makeField('multi', 'What would make campus better?'),
          options: ['More study spaces', 'Better food', 'More events', 'Wellbeing support'],
        },
        makeField('scale', 'How connected do you feel to campus?'),
        { ...makeField('textarea', 'One thing you wish someone would ask?'), required: false },
      ],
    }),
  },
  {
    id: 'contact',
    name: 'Let’s make something.',
    category: 'Business',
    description: 'A friendlier first introduction.',
    theme: 'classic',
    symbol: '↔',
    build: () => ({
      ...base(
        'Let’s make something.',
        'Got a project in mind? Tell us a little about it.',
        'classic',
      ),
      font: 'clean',
      fields: [
        makeField('text', 'Your name'),
        makeField('email', 'Email address'),
        makeField('textarea', 'What are you thinking?'),
        {
          ...makeField('dropdown', 'What’s your timeline?'),
          options: ['As soon as possible', 'This month', 'This quarter', 'Just exploring'],
        },
        { ...makeField('file', 'Anything we should see?'), required: false },
      ],
    }),
  },
  {
    id: 'club',
    name: 'Find your kind of people.',
    category: 'Education',
    description: 'A warm welcome to your club.',
    theme: 'bloom',
    symbol: '♡',
    build: () => ({
      ...base(
        'Find your kind of people.',
        'A little curiosity is all you need. Come join our community.',
        'bloom',
      ),
      fields: [
        makeField('text'),
        makeField('email'),
        {
          ...makeField('multi', 'What are you into?'),
          options: [
            'Making things',
            'Meeting people',
            'Learning something new',
            'A bit of everything',
          ],
        },
        makeField('textarea', 'Tell us one fun thing about you.'),
      ],
    }),
  },
  {
    id: 'creative',
    name: 'Your next chapter.',
    category: 'Business',
    description: 'Collect creative project briefs.',
    theme: 'midnight',
    symbol: '✷',
    build: () => ({
      ...base(
        'Your next chapter.',
        'Let’s turn that half-formed idea into something worth sharing.',
        'midnight',
      ),
      layout: 'conversation',
      fields: [
        makeField('text', 'What’s the project called?'),
        makeField('textarea', 'What’s the big idea?'),
        makeField('url', 'A link to your world'),
        makeField('email', 'Where should we say hello?'),
      ],
    }),
  },
];
export function templateDefinition(id?: string) {
  return templates.find((t) => t.id === id)?.build() || blankForm();
}
