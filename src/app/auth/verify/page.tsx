import { Mail } from 'lucide-react';
import Link from 'next/link';

export default function VerifyPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-8 bg-slate-50 min-h-screen">
      <div className="w-full max-w-sm text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-50 rounded-full mb-5">
          <Mail className="w-7 h-7 text-indigo-600" />
        </div>
        <h1 className="text-xl font-semibold text-slate-900 mb-2">Verifiez votre email</h1>
        <p className="text-sm text-slate-500 leading-relaxed mb-6">
          Un email de verification a ete envoye a votre adresse.
          Cliquez sur le lien pour activer votre compte.
        </p>
        <Link
          href="/auth/login"
          className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          Retour a la connexion
        </Link>
      </div>
    </div>
  );
}
