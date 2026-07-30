import type { Metadata } from 'next';
import SurveyClient from './SurveyClient';

export const metadata: Metadata = {
  title: 'Answer survey',
  description: 'Share an answer without attaching your identity.',
};

export default function SurveyPage() {
  return (
    <main className="flex min-h-0 flex-1">
      <SurveyClient />
    </main>
  );
}
