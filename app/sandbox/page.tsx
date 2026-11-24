import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ThemeSandbox from './_components/ThemeSandbox';

export const metadata: Metadata = {
  title: 'Sandbox de tema',
  robots: { index: false, follow: false },
};

export default function ThemeSandboxPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return <ThemeSandbox />;
}
