"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/app/lib/api/user";
import { UserType } from "@/app/lib/types";
import { Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

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
      // Загружаем всех пользователей, которые являются тренерами и не проверены
      const response = await fetch("/api/users/search?role=TEACHER&checked=false");
      // Примечание: Вам нужно будет реализовать этот endpoint или использовать прямой запрос к Prisma в Server Component.
      // Для простоты примера предположим, что у нас есть такой API или мы делаем fetch('/api/admin/pending-teachers')
      
      // Альтернативный вариант через прямой API админки (рекомендуется создать app/api/admin/pending-teachers/route.ts)
      const res = await fetch("/api/admin/pending-teachers");
      const data = await res.json();
      setPendingTeachers(data.teachers || []);
    } catch (error) {
      console.error(error);
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
        // Удаляем из списка локально
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Заявки тренеров</h1>
        <p className="text-neutral-500 mt-1">Ожидают подтверждения: {pendingTeachers.length}</p>
      </div>

      {pendingTeachers.length === 0 ? (
        <div className="text-center py-16 bg-neutral-50 rounded-xl border border-neutral-200 border-dashed">
          <p className="text-neutral-900 font-medium">Нет новых заявок</p>
          <p className="text-sm text-neutral-500 mt-1">Все тренеры проверены</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {pendingTeachers.map((teacher) => (
            <div key={teacher.id} className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                
                {/* Информация о тренере */}
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-900">{teacher.fullname}</h3>
                    <p className="text-neutral-500">{teacher.email}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-neutral-700">Телефон:</span>
                      <p className="text-neutral-600">{teacher.phone || "Не указан"}</p>
                    </div>
                    <div>
                      <span className="font-medium text-neutral-700">Дата регистрации:</span>
                      <p className="text-neutral-600">
                        {new Date(teacher.createdAt).toLocaleDateString("ru-RU")}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-neutral-100">
                    <h4 className="font-medium text-neutral-900 mb-2">Документы и Био</h4>
                    
                    {teacher.passport && (
                      <div className="mb-3">
                        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Паспортные данные / Документ</span>
                        <div className="mt-1 p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-neutral-700 break-words">
                          {teacher.passport}
                        </div>
                      </div>
                    )}

                    {teacher.bio && (
                      <div>
                        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">О себе</span>
                        <p className="mt-1 text-neutral-600 italic">"{teacher.bio}"</p>
                      </div>
                    )}
                    
                    {!teacher.passport && !teacher.bio && (
                      <p className="text-sm text-neutral-400">Нет дополнительной информации</p>
                    )}
                  </div>
                </div>

                {/* Действия */}
                <div className="flex flex-col justify-start md:items-end gap-3 min-w-[200px]">
                  <Button
                    onClick={() => handleVerify(teacher.id)}
                    disabled={verifyingId === teacher.id}
                    className="w-full md:w-auto bg-black hover:bg-neutral-800 text-white"
                  >
                    {verifyingId === teacher.id ? "Подтверждение..." : "Подтвердить тренера"}
                  </Button>
                  
                  <a 
                    href={`mailto:${teacher.email}`}
                    className="text-sm text-neutral-500 hover:text-black underline decoration-neutral-300 hover:decoration-black underline-offset-4 transition-all"
                  >
                    Написать письмо
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}