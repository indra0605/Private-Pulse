import type { Metadata } from 'next';
import SurveyClient from './survey/SurveyClient';

export const metadata: Metadata = {
  title: 'Private Pulse',
  description: 'Share and read anonymous survey responses.',
};

export default function Home() {
  return (
    <main className="flex min-h-svh flex-1">
      <SurveyClient />
    </main>
  );
}
