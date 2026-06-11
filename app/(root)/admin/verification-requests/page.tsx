"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/app/lib/api/user";
import { UserType } from "@/app/lib/types";
import { Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

interface PendingTeacher extends UserType {
  passport: string | null;
  bio: string | null;
  createdAt: string;
}

export default function VerificationRequestsPage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [pendingTeachers, setPendingTeachers] = useState<PendingTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  
  // Состояние для модального окна с фото
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const init = async () => {
      const currentUser = await getCurrentUser();
      
      if (!currentUser || currentUser.role !== Role.ADMIN) {
        router.push("/");
        return;
      }
      
      setUser(currentUser);
      await loadPendingTeachers();
    };
    
    init();
  }, [router]);

  const loadPendingTeachers = async () => {
    try {
      const res = await fetch("/api/admin/pending-teachers");
      const data = await res.json();
      setPendingTeachers(data.teachers || []);
    } catch (error) {
      console.error(error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список заявок",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (teacherId: string) => {
    setVerifyingId(teacherId);
    try {
      const res = await fetch("/api/admin/verify-teacher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: teacherId }),
      });

      const result = await res.json();

      if (result.success) {
        toast({
          title: "Успешно",
          description: "Тренер успешно подтвержден",
        });
        setPendingTeachers(prev => prev.filter(t => t.id !== teacherId));
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось подтвердить тренера",
        variant: "destructive",
      });
    } finally {
      setVerifyingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#a7c2d3]/10">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-[#364954] mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-[#364954]/70 font-medium">Загрузка заявок...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-8 relative">
      {/* Модальное окно для просмотра фото */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-[#84b1cb] transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="relative w-full h-full flex items-center justify-center">
              <Image 
                src={selectedImage} 
                alt="Просмотр документа" 
                width={1000}
                height={1000}
                className="object-contain rounded-lg shadow-2xl"
                unoptimized
              />
            </div>
            <p className="text-white/70 mt-4 text-sm">Нажмите в любом месте, чтобы закрыть</p>
          </div>
        </div>
      )}

      <div className="mb-10 flex items-end justify-between border-b border-[#a7c2d3]/30 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-[#364954] tracking-tight">Заявки тренеров</h1>
          <p className="text-[#364954]/60 mt-2">
            Ожидают подтверждения: <span className="font-semibold text-[#364954]">{pendingTeachers.length}</span>
          </p>
        </div>
      </div>

      {pendingTeachers.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-[#a7c2d3]/30 border-dashed">
          <div className="w-16 h-16 bg-[#a7c2d3]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#364954]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-[#364954] font-medium text-lg">Нет новых заявок</p>
          <p className="text-sm text-[#364954]/50 mt-1">Все тренеры уже проверены и верифицированы</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pendingTeachers.map((teacher) => (
            <div key={teacher.id} className="bg-white rounded-xl border border-[#a7c2d3]/30 p-6 transition-all duration-300 hover:border-[#84b1cb]/50">
              <div className="flex flex-col md:flex-row gap-8">
                
                {/* Левая часть: Информация */}
                <div className="flex-1 space-y-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-[#364954]">{teacher.fullname}</h3>
                      <p className="text-[#364954]/60 text-sm mt-1">{teacher.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                    <div>
                      <span className="block text-xs font-semibold text-[#364954]/50 uppercase tracking-wider mb-1">Телефон</span>
                      <p className="text-[#364954] font-medium">{teacher.phone || "Не указан"}</p>
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-[#364954]/50 uppercase tracking-wider mb-1">Дата регистрации</span>
                      <p className="text-[#364954] font-medium">
                        {new Date(teacher.createdAt).toLocaleDateString("ru-RU")}
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-[#a7c2d3]/20">
                    <h4 className="text-sm font-bold text-[#364954] mb-4 flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#84b1cb]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Документы и информация
                    </h4>
                    
                    <div className="space-y-4">
                      {teacher.passport && (
                        <div>
                          <span className="text-xs font-semibold text-[#364954]/50 uppercase tracking-wider block mb-2">Паспорт / Документ</span>
                          {/* Кликабельный контейнер для фото */}
                          <div 
                            onClick={() => setSelectedImage(teacher.passport)}
                            className="relative w-full max-w-xs h-48 bg-[#a7c2d3]/5 rounded-lg border border-[#a7c2d3]/20 overflow-hidden group cursor-zoom-in hover:border-[#84b1cb] transition-colors"
                          >
                            <Image 
                              src={teacher.passport} 
                              alt="Документ тренера" 
                              fill
                              className="object-contain p-2 transition-transform duration-500"
                            />
                          </div>
                        </div>
                      )}

                      {teacher.bio && (
                        <div>
                          <span className="text-xs font-semibold text-[#364954]/50 uppercase tracking-wider block mb-2">О себе</span>
                          <p className="text-[#364954]/80 italic bg-[#a7c2d3]/5 p-4 rounded-lg border border-[#a7c2d3]/10">
                            "{teacher.bio}"
                          </p>
                        </div>
                      )}
                      
                      {!teacher.passport && !teacher.bio && (
                        <p className="text-sm text-[#364954]/40 italic">Дополнительная информация не предоставлена</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Правая часть: Действия */}
                <div className="flex flex-col justify-between md:w-64 gap-4 pt-6 md:pt-0 md:border-l md:border-[#a7c2d3]/20 md:pl-8">
                  <div>
                    <p className="text-xs text-[#364954]/50 mb-4">
                      После подтверждения тренер получит доступ к управлению учениками и расписанием.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <Button
                      onClick={() => handleVerify(teacher.id)}
                      disabled={verifyingId === teacher.id}
                      className="w-full h-12 text-base font-semibold bg-[#364954] text-white border border-[#364954] hover:bg-[#84b1cb] hover:border-[#84b1cb] transition-all duration-300 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {verifyingId === teacher.id ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Обработка...
                        </span>
                      ) : (
                        "Подтвердить"
                      )}
                    </Button>
                    
                    <a 
                      href={`mailto:${teacher.email}`}
                      className="flex items-center justify-center w-full h-12 px-4 py-2 text-sm font-medium text-[#364954] bg-white border border-[#a7c2d3] rounded-md hover:bg-[#a7c2d3]/10 hover:text-[#364954] transition-all duration-300"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Написать email
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}