import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PersonSandbox from './_components/PersonSandbox';

export const metadata: Metadata = {
  title: 'Sandbox da identidade',
  robots: { index: false, follow: false },
};

export default function PersonSandboxPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return <PersonSandbox />;
}
