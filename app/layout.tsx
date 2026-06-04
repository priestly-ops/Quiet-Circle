import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'QuietCircle India | MannMitra', description: 'Private mental wellness support for Indian life.' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><header className="sticky top-0 z-40 border-b border-teal-900/10 bg-cream/90 backdrop-blur"><div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3"><Link href="/" className="text-xl font-bold text-teal">QuietCircle India</Link><nav className="hidden gap-5 text-sm md:flex"><Link href="/anonymous">Start anonymously</Link><Link href="/therapists">Therapists</Link><Link href="/emergency">Emergency help</Link><Link href="/auth/login">Login</Link></nav></div></header>{children}<footer className="border-t border-teal-900/10 bg-white/60 px-4 py-8 text-center text-sm text-slate-600">MannMitra is not an emergency service and does not replace professional medical care, diagnosis, or treatment. If you are in immediate danger or thinking about harming yourself, call emergency services or a crisis helpline immediately.</footer></body></html>;
}
