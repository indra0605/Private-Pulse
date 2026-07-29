import type { Metadata } from 'next';
import DeployClient from './DeployClient';

export const metadata: Metadata = {
  title: 'Launch a survey',
  description: 'Launch a Private Pulse survey through 1AM Wallet.',
};

export default function DeployPage() {
  return (
    <main className="deploy-page flex min-h-0 flex-1 items-center">
      <DeployClient />
    </main>
  );
}
