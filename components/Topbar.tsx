"use client";

import { getCurrentUser } from "@/app/lib/api/user";
import { UserType } from "@/app/lib/types";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Role } from "@prisma/client";
import Link from "next/link";
import { signOut } from "next-auth/react";
import Image from "next/image";

const Topbar = () => {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        } else {
          // Если мы уже на странице входа, не редиректим бесконечно
          if (pathname !== "/sign-in") {
            router.push("/sign-in");
          }
        }
      } catch (error) {
        console.error("Auth error:", error);
        if (pathname !== "/sign-in") {
          router.push("/sign-in");
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, pathname]);

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: "/sign-in" });
  };

  const handleProfileClick = () => {
    if (user) {
      router.push(`/profile/${user.id}`);
    }
    setShowMenu(false);
  };

  const handleLessonsClick = () => {
    router.push("/lessons");
    setShowMenu(false);
  };

  const handleStudentsClick = () => {
    router.push("/my-students");
    setShowMenu(false);
  };

  // Хелпер для проверки активного пути
  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + "/");
  };

  // Классы для активной ссылки
  const activeClass = "bg-white/20 text-white font-semibold";
  // Классы для неактивной ссылки
  const inactiveClass = "text-white/80 hover:text-white hover:bg-white/10";

  if (loading) {
    return (
      <nav className="bg-[#84b1cb] sticky top-0 z-50 border-b border-blue-400/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo Skeleton */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg animate-pulse"></div>
              <div className="w-24 h-6 bg-white/20 rounded animate-pulse"></div>
            </div>

            {/* Desktop Links Skeleton */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="w-24 h-9 bg-white/20 rounded-lg animate-pulse"></div>
              <div className="w-24 h-9 bg-white/20 rounded-lg animate-pulse"></div>
            </div>

            {/* User Menu Skeleton */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <div className="w-24 h-4 bg-white/20 rounded mb-1 animate-pulse"></div>
                <div className="w-16 h-3 bg-white/10 rounded animate-pulse"></div>
              </div>
              <div className="w-10 h-10 bg-white/20 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  if (!user) return null;

  const isTeacher = user.role === Role.TEACHER;
  const isStudent = user.role === Role.STUDENT;
  const isAdmin = user.role === Role.ADMIN;

  return (
    <nav className="bg-[#84b1cb] sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="shrink-0">
            <Link href="/" className="flex items-center gap-2 group">
              <Image 
                src="/images/droneLogo.png" 
                alt="EDrone" 
                width={40} 
                height={40} 
                className="transition-transform"
              /> 
              <span className="text-xl font-bold text-white tracking-tight drop-shadow-sm">EDrone</span>
            </Link>
          </div>

          {/* Navigation Links (Desktop) */}
          <div className="hidden md:flex items-center space-x-2">
            {isStudent && (
              <button
                onClick={handleLessonsClick}
                className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                  isActive("/lessons") ? activeClass : inactiveClass
                }`}
              >
                Мои уроки
              </button>
            )}

            {isTeacher && (
              <button
                onClick={handleStudentsClick}
                className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                  isActive("/my-students") ? activeClass : inactiveClass
                }`}
              >
                Мои ученики
              </button>
            )}

            {isAdmin && (
              <>
                <Link 
                  href="/admin/users" 
                  className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                    isActive("/admin/users") ? activeClass : inactiveClass
                  }`}
                >
                  Пользователи
                </Link>
                <Link 
                  href="/admin/verification-requests" 
                  className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                    isActive("/admin/verification-requests") ? activeClass : inactiveClass
                  }`}
                >
                  Заявки
                </Link>
                <Link 
                  href="/admin/support-requests" 
                  className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                    isActive("/admin/support-requests") ? activeClass : inactiveClass
                  }`}
                >
                  Поддержка
                </Link>
              </>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-3 focus:outline-none group p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white leading-tight">{user.fullname}</p>
                <p className="text-xs text-white/70">
                  {isTeacher ? "Тренер" : isStudent ? "Ученик" : "Администратор"}
                </p>
              </div>
              <div className="w-9 h-9 bg-white text-[#84b1cb] rounded-full flex items-center justify-center font-bold shadow-sm border-2 border-white/20">
                {user.fullname?.charAt(0).toUpperCase() || "U"}
              </div>
            </button>

            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowMenu(false)}
                ></div>
                
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
                    <p className="text-sm font-bold text-gray-900">{user.fullname}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  
                  <button
                    onClick={handleProfileClick}
                    className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center gap-2 ${
                      isActive(`/profile/${user.id}`) 
                        ? "bg-neutral-100 text-neutral-900 font-medium" 
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    Мой профиль
                  </button>

                  {isStudent && (
                    <button
                      onClick={handleLessonsClick}
                      className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center gap-2 ${
                        isActive("/lessons") 
                          ? "bg-neutral-100 text-neutral-900 font-medium" 
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                      Мои уроки
                    </button>
                  )}

                  {isTeacher && (
                    <button
                      onClick={handleStudentsClick}
                      className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center gap-2 ${
                        isActive("/my-students") 
                          ? "bg-neutral-100 text-neutral-900 font-medium" 
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                      Мои ученики
                    </button>
                  )}

                  <div className="border-t border-gray-100 mt-2 pt-2">
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      Выйти
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-white/20 bg-[#7aa3bc]">
        <div className="flex justify-around py-2">
          {isStudent && (
            <button
              onClick={handleLessonsClick}
              className={`flex flex-col items-center px-3 py-1 rounded-lg transition-colors ${
                isActive("/lessons") ? "text-white bg-white/10" : "text-white/70 hover:text-white"
              }`}
            >
              <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              <span className="text-xs font-medium">Уроки</span>
            </button>
          )}
          
          {isTeacher && (
            <button
              onClick={handleStudentsClick}
              className={`flex flex-col items-center px-3 py-1 rounded-lg transition-colors ${
                isActive("/my-students") ? "text-white bg-white/10" : "text-white/70 hover:text-white"
              }`}
            >
              <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              <span className="text-xs font-medium">Ученики</span>
            </button>
          )}
          
          <button
            onClick={handleProfileClick}
            className={`flex flex-col items-center px-3 py-1 rounded-lg transition-colors ${
              isActive(`/profile/${user.id}`) ? "text-white bg-white/10" : "text-white/70 hover:text-white"
            }`}
          >
            <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            <span className="text-xs font-medium">Профиль</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Topbar;