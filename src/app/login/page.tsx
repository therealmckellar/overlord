import { redirect } from 'next/navigation';

export default function LoginPage() {
  // Overlord uses a root-level AuthGate in page.tsx for authentication.
  // We redirect any manual visits to /login back to the root.
  redirect('/');
}
