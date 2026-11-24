import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import StatesSandbox from './_components/StatesSandbox';

export const metadata: Metadata = {
  title: 'Sandbox dos estados',
  robots: { index: false, follow: false },
};

export default function StatesSandboxPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return <StatesSandbox />;
}
