"use client";

import { getCurrentUser, getUserById } from "@/app/lib/api/user";
import { UserType } from "@/app/lib/types";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Role } from "@prisma/client";
import GameProgressChart from "@/components/GameProgressCharts";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const Profile = () => {
  const params = useParams();
  const id = params.id;
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPassport, setShowPassport] = useState(false);
  const [showMedicalDocs, setShowMedicalDocs] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      try {
        const profileUser = await getUserById(id as string);
        const loggedInUser = await getCurrentUser();
        
        setCurrentUser(loggedInUser);
        
        if (profileUser) {
          setUser(profileUser);
        } else {
          router.push("/404");
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        router.push("/404");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      getUser();
    }
  }, [id, router]);

  const isCurrentUser = currentUser?.id === user?.id;
  const isAdmin = currentUser?.role === Role.ADMIN;
  const isTeacher = currentUser?.role === Role.TEACHER;
  const isStudent = currentUser?.role === Role.STUDENT;
  const isProfileOwner = isCurrentUser;

  const canViewPassport = isProfileOwner || isAdmin;
  const canViewMedicalDocs = isProfileOwner || isAdmin;
  const canViewTeacherInfo = isProfileOwner || isStudent || isAdmin;
  const canViewStudentList = (isProfileOwner && isTeacher) || isAdmin;

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-[#364954] mx-auto mb-4" />
          <p className="text-[#364954] text-base font-medium">Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getRoleDisplay = (role: Role) => {
    switch (role) {
      case Role.STUDENT:
        return "Ученик";
      case Role.TEACHER:
        return "Тренер";
      case Role.ADMIN:
        return "Администратор";
      default:
        return role;
    }
  };

  // Хелпер для безопасного рендеринга документов
  const renderDocumentContent = (docUrl: string | null | undefined, title: string) => {
    if (!docUrl) {
      return (
        <div className="text-center py-12 text-[#364954]/60 bg-[#a7c2d3]/10 rounded-lg border border-dashed border-[#a7c2d3]">
          <svg className="w-10 h-10 mx-auto mb-3 text-[#a7c2d3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <p className="text-sm">{title} не загружены</p>
        </div>
      );
    }

    // Определяем тип контента по расширению или наличию http
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(docUrl);
    const isPdf = /\.pdf$/i.test(docUrl);
    const isExternalLink = docUrl.startsWith("http://") || docUrl.startsWith("https://");

    if (isImage) {
      return (
        <div className="rounded-lg overflow-hidden border border-[#a7c2d3]">
          <img src={docUrl} alt={title} className="w-full h-auto max-h-96 object-contain bg-white" />
        </div>
      );
    }

    if (isPdf || isExternalLink) {
      return (
        <div className="rounded-lg border border-[#a7c2d3] overflow-hidden">
          <iframe 
            src={docUrl} 
            className="w-full h-96 bg-white" 
            title={`Просмотр ${title}`}
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      );
    }

    return (
      <div className="p-4 bg-[#a7c2d3]/10 rounded-lg border border-[#a7c2d3]">
        <p className="text-sm text-[#364954] mb-2">Файл документа:</p>
        <a 
          href={docUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[#84b1cb] hover:text-[#364954] underline font-medium break-all"
        >
          {docUrl}
        </a>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <div className="mb-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-[#364954] hover:text-[#84b1cb] flex items-center gap-2 transition-colors font-medium"
          aria-label="Вернуться назад"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Назад
        </button>
      </div>

      {isAdmin && (
        <div className="mb-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => router.push("/admin/verification-requests")}
            className="px-4 py-2.5 bg-[#364954] text-white rounded-lg hover:bg-[#84b1cb] transition-colors font-medium text-sm shadow-sm"
          >
            Заявки на регистрацию тренеров
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/support-requests")}
            className="px-4 py-2.5 bg-[#364954] text-white rounded-lg hover:bg-[#84b1cb] transition-colors font-medium text-sm shadow-sm"
          >
            Заявки в поддержку
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/users")}
            className="px-4 py-2.5 bg-[#364954] text-white rounded-lg hover:bg-[#84b1cb] transition-colors font-medium text-sm shadow-sm"
          >
            Все пользователи
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-[#364954] px-6 md:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3 flex-wrap">
                {user.fullname}
                {user.role === Role.TEACHER && !user.isChecked && (
                  <span className="text-xs bg-[#84b1cb]/20 text-[#a7c2d3] px-3 py-1 rounded-full font-medium border border-[#84b1cb]/40">
                    На проверке
                  </span>
                )}
                {user.role === Role.TEACHER && user.isChecked && (
                  <span className="text-xs bg-[#84b1cb] text-[#364954] px-3 py-1 rounded-full font-medium">
                    Подтвержден
                  </span>
                )}
              </h1>
              <p className="text-[#a7c2d3] mt-2 flex items-center gap-2 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                {user.email}
              </p>
            </div>
            <div className="flex gap-3">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => router.push(`/admin/users/${user.id}/edit`)}
                  className="px-4 py-2.5 bg-[#84b1cb] text-[#364954] rounded-lg hover:bg-[#a7c2d3] transition-colors font-medium text-sm"
                >
                  Управление
                </button>
              )}
              {isProfileOwner && (
                <button
                  type="button"
                  onClick={() => toast.error("Функция редактирования профиля пока недоступна")}
                  className="px-4 py-2.5 bg-white text-[#364954] rounded-lg hover:bg-[#a7c2d3]/20 transition-colors font-medium text-sm border border-[#a7c2d3]"
                >
                  Редактировать
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          {/* Contact Info & Bio */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-[#a7c2d3]/10 rounded-xl p-6 border border-[#a7c2d3]/30">
              <h2 className="text-lg font-semibold mb-5 flex items-center gap-2 text-[#364954]">
                <svg className="w-5 h-5 text-[#84b1cb]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                Контактная информация
              </h2>
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white border border-[#a7c2d3]/40 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-[#364954]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#364954]/60 uppercase tracking-wider">Телефон</p>
                    <p className="font-medium text-[#364954] mt-1">{user.phone || "Не указан"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white border border-[#a7c2d3]/40 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-[#364954]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#364954]/60 uppercase tracking-wider">Дата рождения</p>
                    <p className="font-medium text-[#364954] mt-1">{user.birthDate ? new Date(user.birthDate).toLocaleDateString("ru-RU") : "Не указана"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white border border-[#a7c2d3]/40 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-[#364954]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#364954]/60 uppercase tracking-wider">Роль</p>
                    <p className="font-medium text-[#364954] mt-1">{getRoleDisplay(user.role)}</p>
                  </div>
                </div>
                {user.role === Role.TEACHER && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white border border-[#a7c2d3]/40 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-[#364954]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#364954]/60 uppercase tracking-wider">Статус</p>
                      <p className="font-medium text-[#364954] mt-1">
                        {user.isChecked ? "Подтвержден" : "Ожидает проверки"}
                      </p>
                    </div>
                  </div>
                )}
                {user.role === Role.TEACHER && user.students && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white border border-[#a7c2d3]/40 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-[#364954]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#364954]/60 uppercase tracking-wider">Учеников</p>
                      <p className="font-medium text-[#364954] mt-1">{user.students.length}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#a7c2d3]/10 rounded-xl p-6 border border-[#a7c2d3]/30">
              <h2 className="text-lg font-semibold mb-5 flex items-center gap-2 text-[#364954]">
                <svg className="w-5 h-5 text-[#84b1cb]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7"></path></svg>
                О себе
              </h2>
              {user.bio ? (
                <p className="text-[#364954] whitespace-pre-wrap leading-relaxed text-sm">{user.bio}</p>
              ) : (
                <p className="text-[#364954]/60 italic text-sm">
                  {isProfileOwner ? "Вы еще не заполнили информацию о себе" : "Пользователь не заполнил информацию о себе"}
                </p>
              )}
            </div>
          </div>

          {/* Documents Section - FIXED */}
          {(canViewPassport || canViewMedicalDocs) && (
            <div className="bg-[#a7c2d3]/10 rounded-xl p-6 border border-[#a7c2d3]/30">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-[#364954]">
                <svg className="w-5 h-5 text-[#84b1cb]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                Документы
              </h2>
              <div className="space-y-6">
                {user.role === Role.TEACHER && canViewPassport && (
                  <div className="bg-white rounded-lg p-5 border border-[#a7c2d3]/40">
                    <button
                      type="button"
                      onClick={() => setShowPassport(!showPassport)}
                      className="flex items-center gap-2 text-[#364954] hover:text-[#84b1cb] font-medium transition-colors text-sm"
                    >
                      <svg className={`w-4 h-4 transition-transform duration-200 ${showPassport ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                      {showPassport ? "Скрыть паспорт" : "Показать паспорт"}
                    </button>
                    
                    {showPassport && (
                      <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        {renderDocumentContent(user.passport, "Паспорт")}
                      </div>
                    )}
                  </div>
                )}

                {user.role === Role.STUDENT && canViewMedicalDocs && (
                  <div className="bg-white rounded-lg p-5 border border-[#a7c2d3]/40">
                    <button
                      type="button"
                      onClick={() => setShowMedicalDocs(!showMedicalDocs)}
                      className="flex items-center gap-2 text-[#364954] hover:text-[#84b1cb] font-medium transition-colors text-sm"
                    >
                      <svg className={`w-4 h-4 transition-transform duration-200 ${showMedicalDocs ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                      {showMedicalDocs ? "Скрыть медицинские документы" : "Показать медицинские документы"}
                    </button>
                    
                    {showMedicalDocs && (
                      <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        {renderDocumentContent(user.medicalDocuments, "Медицинские документы")}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Teacher Info */}
          {user.role === Role.STUDENT && user.teacher && canViewTeacherInfo && (
            <div className="bg-[#a7c2d3]/10 rounded-xl p-6 border border-[#a7c2d3]/30">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-[#364954]">
                <svg className="w-5 h-5 text-[#84b1cb]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                Мой тренер
              </h2>
              <div className="bg-white rounded-lg p-6 border border-[#a7c2d3]/40">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-lg font-semibold text-[#364954]">{user.teacher.fullname}</p>
                    <p className="text-[#364954]/70 mt-1 text-sm">{user.teacher.email}</p>
                    {user.teacher.bio && <p className="text-[#364954] mt-4 leading-relaxed text-sm">{user.teacher.bio}</p>}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => router.push(`/profile/${user.teacher?.id}`)}
                  className="mt-6 px-4 py-2.5 bg-[#364954] text-white rounded-lg hover:bg-[#84b1cb] transition-colors font-medium text-sm"
                >
                  Посмотреть профиль тренера
                </button>
              </div>
            </div>
          )}

          {/* Students List */}
          {user.role === Role.TEACHER && user.students && user.students.length > 0 && canViewStudentList && (
            <div className="bg-[#a7c2d3]/10 rounded-xl p-6 border border-[#a7c2d3]/30">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-[#364954]">
                <svg className="w-5 h-5 text-[#84b1cb]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                {isProfileOwner ? "Мои ученики" : "Ученики"} 
                <span className="text-sm text-[#364954]/60 font-normal ml-1">({user.students.length})</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {user.students.map((student) => (
                  <div key={student.id} className="bg-white rounded-lg p-5 border border-[#a7c2d3]/40 hover:border-[#84b1cb] transition-colors">
                    <p className="font-semibold text-[#364954]">{student.fullname}</p>
                    <p className="text-[#364954]/60 text-sm mt-1">{student.email}</p>
                    <button
                      type="button"
                      onClick={() => router.push(`/profile/${student.id}`)}
                      className="mt-4 w-full px-3 py-2 bg-[#a7c2d3]/20 text-[#364954] rounded-lg hover:bg-[#84b1cb] hover:text-white transition-colors font-medium text-sm"
                    >
                      Открыть профиль
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Game Stats */}
          {user.role === Role.STUDENT && (
            <div className="bg-[#a7c2d3]/10 rounded-xl p-6 border border-[#a7c2d3]/30">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-[#364954]">
                <svg className="w-5 h-5 text-[#84b1cb]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                {isProfileOwner ? "Моя игровая статистика" : `Игровая статистика: ${user.fullname}`}
              </h2>
              <GameProgressChart userId={user.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;