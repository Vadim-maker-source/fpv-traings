"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { getCurrentUser, getUserById } from "@/app/lib/api/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { EditLessonModal } from "../../../../../../components/EditLessonModal";

interface Lesson {
  id: string;
  lessonNumber: number;
  topic: string;
  scheduledAt: string;
  meetLink: string | null;
  status: string;
}

export default function ViewSchedulePage() {
  const params = useParams();
  const studentId = params.studentId as string;
  const router = useRouter();
  const { toast } = useToast();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [studentName, setStudentName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [editingLink, setEditingLink] = useState<string | null>(null);
  const [newLink, setNewLink] = useState("");
  const [updating, setUpdating] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    const loadData = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.replace("/sign-in");
          return;
        }

        const studentData = await getUserById(studentId);
        if (!studentData) {
          toast({
            title: "Ошибка",
            description: "Ученик не найден",
            variant: "destructive",
          });
          router.replace("/my-students");
          return;
        }
        setStudentName(studentData.fullname);

        await loadLessons();
      } catch (error) {
        console.error("Load error:", error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить расписание",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      loadData();
    }
  }, [studentId, router, toast]);

  const loadLessons = async () => {
    const lessonsResponse = await fetch(`/api/lessons/student/${studentId}`);
    const lessonsData = await lessonsResponse.json();
    setLessons(lessonsData.lessons || []);
  };

  const handleUpdateLink = async (lessonId: string) => {
    if (!newLink.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите ссылку на урок",
        variant: "destructive",
      });
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch("/api/lessons/update-link", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, meetLink: newLink }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Успешно",
          description: "Ссылка на урок добавлена. Ученик получит уведомление.",
        });
        
        setLessons(prev => prev.map(lesson =>
          lesson.id === lessonId ? { ...lesson, meetLink: newLink } : lesson
        ));
        setEditingLink(null);
        setNewLink("");
      } else {
        toast({
          title: "Ошибка",
          description: result.error || "Не удалось добавить ссылку",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Update link error:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить ссылку",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleLessonUpdate = async () => {
    await loadLessons();
    toast({
      title: "Успешно",
      description: "Урок обновлен. Ученик получил уведомление на email.",
    });
  };

  const getStatusBadge = (status: string, scheduledAt: string) => {
    const now = new Date();
    const lessonDate = new Date(scheduledAt);
    
    if (status === "COMPLETED") {
      return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-green-50 text-green-700 border border-green-100">Проведен</span>;
    }
    
    if (lessonDate < now) {
      return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-yellow-50 text-yellow-700 border border-yellow-100">Просрочен</span>;
    }
    
    return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-100">Запланирован</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-black mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-neutral-500 font-medium">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Расписание уроков</h1>
          <p className="text-neutral-500 mt-1">Ученик: <span className="font-medium text-neutral-700">{studentName}</span></p>
        </div>
        <Button
          onClick={() => router.push("/my-students")}
          className="bg-black hover:bg-neutral-800 text-white font-medium px-6"
        >
          ← Назад к ученикам
        </Button>
      </div>

      <div className="space-y-5">
        {lessons.length === 0 ? (
          <div className="text-center py-16 bg-neutral-50 rounded-xl border border-neutral-200 border-dashed">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100 mb-4">
              <svg className="w-6 h-6 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-neutral-900 font-medium">Расписание еще не создано</p>
            <p className="text-sm text-neutral-500 mt-1 mb-4">
              Создайте расписание, чтобы начать обучение
            </p>
            <Button
              onClick={() => router.push("/my-students")}
              className="bg-black hover:bg-neutral-800 text-white"
            >
              Создать расписание
            </Button>
          </div>
        ) : (
          lessons.map((lesson) => (
            <div key={lesson.id} className="bg-white rounded-xl border border-neutral-200 shadow-sm hover:shadow-md transition-all duration-200 p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-semibold text-neutral-900">Урок {lesson.lessonNumber}</h2>
                      {getStatusBadge(lesson.status, lesson.scheduledAt)}
                    </div>
                    <button
                      onClick={() => {
                        setEditingLesson(lesson);
                        setIsEditModalOpen(true);
                      }}
                      className="text-sm font-medium text-neutral-600 hover:text-black flex items-center gap-1.5 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Редактировать
                    </button>
                  </div>
                  
                  <div>
                    <p className="text-neutral-900">
                      <span className="font-medium text-neutral-500">Тема:</span> {lesson.topic}
                    </p>
                  </div>
                  
                  <p className="text-neutral-600 text-sm">
                    <span className="font-medium text-neutral-500">Дата и время:</span>{" "}
                    {format(new Date(lesson.scheduledAt), "PPP 'в' HH:mm", { locale: ru })}
                  </p>
                  
                  <div className="pt-3 border-t border-neutral-100">
                    {lesson.meetLink ? (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <span className="font-medium text-neutral-500 text-sm whitespace-nowrap">Ссылка на урок:</span>
                        <a
                          href={lesson.meetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-700 break-all hover:underline font-medium"
                        >
                          {lesson.meetLink}
                        </a>
                      </div>
                    ) : (
                      <div>
                        {editingLink === lesson.id ? (
                          <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                            <Input
                              type="url"
                              placeholder="https://zoom.us/... или https://telemost.yandex.ru/..."
                              value={newLink}
                              onChange={(e) => setNewLink(e.target.value)}
                              className="w-full focus:ring-1 focus:ring-black focus:border-black"
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleUpdateLink(lesson.id)}
                                disabled={updating}
                                className="bg-black hover:bg-neutral-800 text-white"
                              >
                                {updating ? "Сохранение..." : "Сохранить"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingLink(null);
                                  setNewLink("");
                                }}
                                className="border-neutral-200 hover:bg-neutral-50 text-neutral-700"
                              >
                                Отмена
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingLink(lesson.id)}
                            className="text-sm font-medium text-black hover:text-neutral-700 flex items-center gap-1 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            Добавить ссылку на урок
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <EditLessonModal
        lesson={editingLesson}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingLesson(null);
        }}
        onUpdate={handleLessonUpdate}
      />
    </div>
  );
}