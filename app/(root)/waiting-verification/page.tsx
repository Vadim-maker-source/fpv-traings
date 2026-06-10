"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";

export default function WaitingVerificationPage() {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-neutral-200 p-8 text-center">
        <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">Заявка на рассмотрении</h1>
        <p className="text-neutral-500 mb-8">
          Ваш профиль тренера отправлен на проверку администратору. 
          Как только мы проверим ваши данные, вы получите полный доступ к кабинету.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => signOut({ callbackUrl: "/sign-in" })}
            className="w-full py-2.5 px-4 bg-white border border-neutral-300 text-neutral-700 font-medium rounded-lg hover:bg-neutral-50 transition-colors"
          >
            Выйти из аккаунта
          </button>
          
          <Link 
            href="/"
            className="block w-full py-2.5 px-4 bg-black text-white font-medium rounded-lg hover:bg-neutral-800 transition-colors text-center"
          >
            На главную
          </Link>
        </div>
      </div>
    </div>
  );
}