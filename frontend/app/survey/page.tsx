import type { Metadata } from 'next';
import SurveyClient from './SurveyClient';

export const metadata: Metadata = {
  title: 'Answer survey',
  description: 'Answer a Private Pulse survey privately.',
};

export default function SurveyPage() {
  return (
    <main className="flex min-h-0 flex-1 items-center">
      <SurveyClient />
    </main>
  );
}
