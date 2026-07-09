import { redirect } from 'next/navigation';

export default function RegisterPage() {
  // Overlord uses a root-level AuthGate in page.tsx for authentication.
  // We redirect any manual visits to /register back to the root.
  redirect('/');
}
