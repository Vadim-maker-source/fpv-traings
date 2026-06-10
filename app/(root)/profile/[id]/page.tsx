"use client";

import { getCurrentUser, getUserById } from "@/app/lib/api/user";
import { UserType } from "@/app/lib/types";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Role } from "@prisma/client";
import GameProgressChart from "@/components/GameProgressCharts";
import { Loader2 } from "lucide-react";

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
          <Loader2 className="animate-spin h-12 w-12 text-black mx-auto mb-4" />
          <p className="text-neutral-500 text-base font-medium">Загрузка профиля...</p>
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

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <div className="mb-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-neutral-600 hover:text-neutral-900 flex items-center gap-2 transition-colors font-medium"
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
            className="px-4 py-2.5 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors font-medium text-sm shadow-sm"
          >
            Заявки на регистрацию тренеров
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/support-requests")}
            className="px-4 py-2.5 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors font-medium text-sm shadow-sm"
          >
            Заявки в поддержку
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/users")}
            className="px-4 py-2.5 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors font-medium text-sm shadow-sm"
          >
            Все пользователи
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="bg-neutral-900 px-6 md:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3 flex-wrap">
                {user.fullname}
                {user.role === Role.TEACHER && !user.isChecked && (
                  <span className="text-xs bg-neutral-700 text-neutral-100 px-3 py-1 rounded-full font-medium border border-neutral-600">
                    На проверке
                  </span>
                )}
                {user.role === Role.TEACHER && user.isChecked && (
                  <span className="text-xs bg-white text-black px-3 py-1 rounded-full font-medium">
                    Подтвержден
                  </span>
                )}
              </h1>
              <p className="text-neutral-400 mt-2 flex items-center gap-2 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                {user.email}
              </p>
            </div>
            <div className="flex gap-3">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => router.push(`/admin/users/${user.id}/edit`)}
                  className="px-4 py-2.5 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors font-medium text-sm"
                >
                  Управление
                </button>
              )}
              {isProfileOwner && (
                <button
                  type="button"
                  onClick={() => router.push("/profile/edit")}
                  className="px-4 py-2.5 bg-white text-black rounded-lg hover:bg-neutral-100 transition-colors font-medium text-sm border border-neutral-200"
                >
                  Редактировать
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-neutral-50 rounded-xl p-6 border border-neutral-100">
              <h2 className="text-lg font-semibold mb-5 flex items-center gap-2 text-neutral-900">
                <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                Контактная информация
              </h2>
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white border border-neutral-200 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Телефон</p>
                    <p className="font-medium text-neutral-900 mt-1">{user.phone || "Не указан"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white border border-neutral-200 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Дата рождения</p>
                    <p className="font-medium text-neutral-900 mt-1">{user.birthDate ? new Date(user.birthDate).toLocaleDateString("ru-RU") : "Не указана"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white border border-neutral-200 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Роль</p>
                    <p className="font-medium text-neutral-900 mt-1">{getRoleDisplay(user.role)}</p>
                  </div>
                </div>
                {user.role === Role.TEACHER && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white border border-neutral-200 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Статус</p>
                      <p className="font-medium text-neutral-900 mt-1">
                        {user.isChecked ? "Подтвержден" : "Ожидает проверки"}
                      </p>
                    </div>
                  </div>
                )}
                {user.role === Role.TEACHER && user.students && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white border border-neutral-200 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Учеников</p>
                      <p className="font-medium text-neutral-900 mt-1">{user.students.length}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-neutral-50 rounded-xl p-6 border border-neutral-100">
              <h2 className="text-lg font-semibold mb-5 flex items-center gap-2 text-neutral-900">
                <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7"></path></svg>
                О себе
              </h2>
              {user.bio ? (
                <p className="text-neutral-700 whitespace-pre-wrap leading-relaxed text-sm">{user.bio}</p>
              ) : (
                <p className="text-neutral-500 italic text-sm">
                  {isProfileOwner ? "Вы еще не заполнили информацию о себе" : "Пользователь не заполнил информацию о себе"}
                </p>
              )}
            </div>
          </div>

          {(canViewPassport || canViewMedicalDocs) && (
            <div className="bg-neutral-50 rounded-xl p-6 border border-neutral-100">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-neutral-900">
                <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                Документы
              </h2>
              <div className="space-y-6">
                {user.role === Role.TEACHER && canViewPassport && (
                  <div className="bg-white rounded-lg p-5 border border-neutral-200">
                    <button
                      type="button"
                      onClick={() => setShowPassport(!showPassport)}
                      className="flex items-center gap-2 text-black hover:text-neutral-600 font-medium transition-colors text-sm"
                    >
                      <svg className={`w-4 h-4 transition-transform ${showPassport ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                      {showPassport ? "Скрыть паспорт" : "Показать паспорт"}
                    </button>
                    <div id="passport-section" className="mt-4">
                      {showPassport && user.passport && (
                        <div className="rounded-lg border border-neutral-200 overflow-hidden">
                          <iframe src={user.passport} className="w-full h-96" title="Просмотр паспорта" />
                        </div>
                      )}
                      {showPassport && !user.passport && (
                        <div className="text-center py-12 text-neutral-500 bg-neutral-50 rounded-lg border border-dashed border-neutral-300">
                          <svg className="w-10 h-10 mx-auto mb-3 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                          <p className="text-sm">Паспорт не загружен</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {user.role === Role.STUDENT && canViewMedicalDocs && (
                  <div className="bg-white rounded-lg p-5 border border-neutral-200">
                    <button
                      type="button"
                      onClick={() => setShowMedicalDocs(!showMedicalDocs)}
                      className="flex items-center gap-2 text-black hover:text-neutral-600 font-medium transition-colors text-sm"
                    >
                      <svg className={`w-4 h-4 transition-transform ${showMedicalDocs ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                      {showMedicalDocs ? "Скрыть медицинские документы" : "Показать медицинские документы"}
                    </button>
                    <div id="medical-section" className="mt-4">
                      {showMedicalDocs && user.medicalDocuments && (
                        <div className="rounded-lg border border-neutral-200 overflow-hidden">
                          <iframe src={user.medicalDocuments} className="w-full h-96" title="Просмотр медицинских документов" />
                        </div>
                      )}
                      {showMedicalDocs && !user.medicalDocuments && (
                        <div className="text-center py-12 text-neutral-500 bg-neutral-50 rounded-lg border border-dashed border-neutral-300">
                          <svg className="w-10 h-10 mx-auto mb-3 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                          <p className="text-sm">Медицинские документы не загружены</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {user.role === Role.STUDENT && user.teacher && canViewTeacherInfo && (
            <div className="bg-neutral-50 rounded-xl p-6 border border-neutral-100">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-neutral-900">
                <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                Мой тренер
              </h2>
              <div className="bg-white rounded-lg p-6 border border-neutral-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-lg font-semibold text-neutral-900">{user.teacher.fullname}</p>
                    <p className="text-neutral-600 mt-1 text-sm">{user.teacher.email}</p>
                    {user.teacher.bio && <p className="text-neutral-700 mt-4 leading-relaxed text-sm">{user.teacher.bio}</p>}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => router.push(`/profile/${user.teacher?.id}`)}
                  className="mt-6 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors font-medium text-sm"
                >
                  Посмотреть профиль тренера
                </button>
              </div>
            </div>
          )}

          {user.role === Role.TEACHER && user.students && user.students.length > 0 && canViewStudentList && (
            <div className="bg-neutral-50 rounded-xl p-6 border border-neutral-100">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-neutral-900">
                <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                {isProfileOwner ? "Мои ученики" : "Ученики"} 
                <span className="text-sm text-neutral-500 font-normal ml-1">({user.students.length})</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {user.students.map((student) => (
                  <div key={student.id} className="bg-white rounded-lg p-5 border border-neutral-200 hover:border-neutral-400 transition-colors">
                    <p className="font-semibold text-neutral-900">{student.fullname}</p>
                    <p className="text-neutral-500 text-sm mt-1">{student.email}</p>
                    <button
                      type="button"
                      onClick={() => router.push(`/profile/${student.id}`)}
                      className="mt-4 w-full px-3 py-2 bg-neutral-100 text-neutral-900 rounded-lg hover:bg-neutral-200 transition-colors font-medium text-sm"
                    >
                      Открыть профиль
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {user.role === Role.STUDENT && (
            <div className="bg-neutral-50 rounded-xl p-6 border border-neutral-100">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-neutral-900">
                <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
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
