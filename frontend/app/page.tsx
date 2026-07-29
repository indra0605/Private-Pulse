import type { Metadata } from 'next';
import SurveyClient from './survey/SurveyClient';

export const metadata: Metadata = {
  title: 'Private Pulse',
  description: 'Answer one question privately.',
};

export default function Home() {
  return (
    <main className="flex min-h-svh flex-1 items-center">
      <SurveyClient />
    </main>
  );
}
