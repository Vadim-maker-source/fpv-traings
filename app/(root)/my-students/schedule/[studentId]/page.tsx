"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { getCurrentUser, getUserById } from "@/app/lib/api/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { format, setHours, setMinutes, isSameDay, startOfDay } from "date-fns";
import { ru } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LessonSchedule {
  lessonNumber: number;
  topic: string;
  scheduledAt: Date | null;
  meetLink: string;
}

interface ValidationErrors {
  [key: number]: {
    topic?: string;
    scheduledAt?: string;
  };
}

interface BusySlot {
  id: string;
  scheduledAt: string;
  student: {
    fullname: string;
  };
}

const AVAILABLE_HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

export default function ScheduleLessonsPage() {
  const params = useParams();
  const studentId = params.studentId as string;
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busySlots, setBusySlots] = useState<BusySlot[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<{ [key: number]: boolean }>({});
  const [lessons, setLessons] = useState<LessonSchedule[]>([
    { lessonNumber: 1, topic: "", scheduledAt: null, meetLink: "" },
    { lessonNumber: 2, topic: "", scheduledAt: null, meetLink: "" },
    { lessonNumber: 3, topic: "", scheduledAt: null, meetLink: "" },
    { lessonNumber: 4, topic: "", scheduledAt: null, meetLink: "" },
    { lessonNumber: 5, topic: "", scheduledAt: null, meetLink: "" },
  ]);
  const [selectedLessonIndex, setSelectedLessonIndex] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dataLoadedRef = useRef(false);

  useEffect(() => {
    if (dataLoadedRef.current) return;
    dataLoadedRef.current = true;

    const loadData = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== "TEACHER") {
          router.push("/sign-in");
          return;
        }
        setUser(currentUser);

        const studentData = await getUserById(studentId);
        if (!studentData) {
          toast({
            title: "Ошибка",
            description: "Ученик не найден",
            variant: "destructive",
          });
          router.push("/my-students");
          return;
        }
        
        if (studentData.teacherId !== currentUser.id) {
          toast({
            title: "Ошибка",
            description: "Этот ученик не принадлежит вам",
            variant: "destructive",
          });
          router.push("/my-students");
          return;
        }
        
        setStudent(studentData);

        const busyResponse = await fetch("/api/teacher/busy-dates");
        const busyData = await busyResponse.json();
        if (busyData.busyDates) {
          setBusySlots(busyData.busyDates);
        }
      } catch (error) {
        console.error("Load data error:", error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить данные",
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

  const getBusyHoursForDate = (date: Date): number[] => {
    if (!date) return [];
    
    return busySlots
      .filter(slot => {
        const slotDate = new Date(slot.scheduledAt);
        return isSameDay(slotDate, date);
      })
      .map(slot => new Date(slot.scheduledAt).getHours());
  };

  const isHourAvailable = (date: Date, hour: number): boolean => {
    if (!date) return false;
    const busyHours = getBusyHoursForDate(date);
    return !busyHours.includes(hour);
  };

  const hasAvailableHours = (date: Date): boolean => {
    if (!date) return false;
    return AVAILABLE_HOURS.some(hour => isHourAvailable(date, hour));
  };

  const openDateTimePicker = (index: number) => {
    setSelectedLessonIndex(index);
    const currentLesson = lessons[index];
    setSelectedDate(currentLesson.scheduledAt || undefined);
    setSelectedHour(currentLesson.scheduledAt ? currentLesson.scheduledAt.getHours() : null);
    setIsModalOpen(true);
  };

  const saveDateTime = () => {
    if (selectedLessonIndex === null) return;
    if (!selectedDate) {
      toast({
        title: "Ошибка",
        description: "Выберите дату",
        variant: "destructive",
      });
      return;
    }
    if (selectedHour === null) {
      toast({
        title: "Ошибка",
        description: "Выберите время",
        variant: "destructive",
      });
      return;
    }

    let newDate = setHours(setMinutes(selectedDate, 0), selectedHour);
    newDate = setMinutes(newDate, 0);
    newDate = new Date(newDate.setSeconds(0, 0));

    if (!isHourAvailable(selectedDate, selectedHour)) {
      toast({
        title: "Время занято",
        description: "Это время уже занято другим уроком. Выберите другое время.",
        variant: "destructive",
      });
      return;
    }

    for (let i = 0; i < lessons.length; i++) {
      if (i !== selectedLessonIndex && lessons[i].scheduledAt) {
        const diffHours = Math.abs(newDate.getTime() - lessons[i].scheduledAt!.getTime()) / (1000 * 3600);
        if (diffHours < 1) {
          toast({
            title: "Интервал слишком маленький",
            description: "Между уроками должен быть минимум 1 час. Выберите другое время.",
            variant: "destructive",
          });
          return;
        }
      }
    }

    const updated = [...lessons];
    updated[selectedLessonIndex] = { ...updated[selectedLessonIndex], scheduledAt: newDate };
    setLessons(updated);
    
    setIsModalOpen(false);
    setSelectedLessonIndex(null);
    setSelectedDate(undefined);
    setSelectedHour(null);
    
    if (touched[selectedLessonIndex]) {
      validateLesson(selectedLessonIndex, updated[selectedLessonIndex]);
    }
  };

  const validateLesson = (index: number, lesson: LessonSchedule): boolean => {
    const errors: { topic?: string; scheduledAt?: string } = {};
    
    if (!lesson.topic.trim()) {
      errors.topic = "Введите тему урока";
    }
    
    if (!lesson.scheduledAt) {
      errors.scheduledAt = "Выберите дату и время урока";
    } else {
      const isAvailable = isHourAvailable(lesson.scheduledAt, lesson.scheduledAt.getHours());
      if (!isAvailable) {
        errors.scheduledAt = "Это время уже занято другим уроком. Выберите другое время.";
      }
    }
    
    setValidationErrors(prev => ({ ...prev, [index]: errors }));
    return Object.keys(errors).length === 0;
  };

  const handleLessonChange = (index: number, field: keyof LessonSchedule, value: any) => {
    const updated = [...lessons];
    updated[index] = { ...updated[index], [field]: value };
    setLessons(updated);
    
    if (touched[index]) {
      validateLesson(index, updated[index]);
    }
  };

  const handleBlur = (index: number) => {
    setTouched(prev => ({ ...prev, [index]: true }));
    validateLesson(index, lessons[index]);
  };

  const validateAllLessons = (): boolean => {
    let isValid = true;
    const newErrors: ValidationErrors = {};
    
    lessons.forEach((lesson, index) => {
      const errors: { topic?: string; scheduledAt?: string } = {};
      
      if (!lesson.topic.trim()) {
        errors.topic = "Введите тему урока";
        isValid = false;
      }
      
      if (!lesson.scheduledAt) {
        errors.scheduledAt = "Выберите дату и время урока";
        isValid = false;
      } else {
        const isAvailable = isHourAvailable(lesson.scheduledAt, lesson.scheduledAt.getHours());
        if (!isAvailable) {
          errors.scheduledAt = "Это время уже занято другим уроком";
          isValid = false;
        }
      }
      
      if (Object.keys(errors).length > 0) {
        newErrors[index] = errors;
      }
    });
    
    setValidationErrors(newErrors);
    
    if (!isValid) {
      toast({
        title: "Ошибка",
        description: "Заполните все обязательные поля или устраните конфликты времени",
        variant: "destructive",
      });
    }
    
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateAllLessons()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/teacher/create-lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          lessons: lessons.map((lesson) => ({
            lessonNumber: lesson.lessonNumber,
            topic: lesson.topic,
            scheduledAt: lesson.scheduledAt!.toISOString(),
            meetLink: lesson.meetLink || null,
          })),
        }),
      });

      const result = await response.json();

      if (response.status === 409) {
        toast({
          title: "Конфликт дат",
          description: "Некоторые даты уже заняты. Пожалуйста, выберите другие даты.",
          variant: "destructive",
        });
        const busyResponse = await fetch("/api/teacher/busy-dates");
        const busyData = await busyResponse.json();
        if (busyData.busyDates) {
          setBusySlots(busyData.busyDates);
        }
      } else if (result.success) {
        toast({
          title: "Успешно",
          description: `Расписание для ${student?.fullname} создано.`,
        });
        router.push(`/my-students/schedule/view/${studentId}`);
      } else {
        toast({
          title: "Ошибка",
          description: result.error || "Не удалось создать расписание",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать расписание",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDateSelectable = (date: Date): boolean => {
    if (date < startOfDay(new Date())) return false;
    return hasAvailableHours(date);
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

  if (!student) return null;

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Создание расписания</h1>
        <p className="text-neutral-500 mt-1">
          Ученик: <span className="font-medium text-neutral-700">{student.fullname}</span> ({student.email})
        </p>
        
        <div className="flex items-start gap-3 mt-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
          <svg className="w-5 h-5 text-neutral-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-neutral-600">
            <p className="font-medium text-neutral-900 mb-1">Правила планирования:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Поля "Тема урока" и "Дата" обязательны для заполнения.</li>
              <li>Нельзя выбрать время, которое уже занято другим уроком.</li>
              <li>Между уроками должен быть минимум 1 час.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {lessons.map((lesson, index) => (
          <div key={lesson.lessonNumber} className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-900 mb-5 flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-neutral-100 text-neutral-700 text-sm font-bold">
                {lesson.lessonNumber}
              </span>
              Урок {lesson.lessonNumber}
            </h2>
            
            <div className="space-y-5">
              <div>
                <Label className="flex items-center gap-1 text-neutral-900">
                  Тема урока <span className="text-red-600">*</span>
                </Label>
                <Input
                  value={lesson.topic}
                  onChange={(e) => handleLessonChange(index, "topic", e.target.value)}
                  onBlur={() => handleBlur(index)}
                  placeholder="Введите тему урока"
                  className={`mt-2 focus:ring-1 focus:ring-black focus:border-black ${validationErrors[index]?.topic ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300'}`}
                />
                {validationErrors[index]?.topic && (
                  <p className="text-red-600 text-sm mt-1.5 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {validationErrors[index].topic}
                  </p>
                )}
              </div>

              <div>
                <Label className="flex items-center gap-1 text-neutral-900">
                  Дата и время <span className="text-red-600">*</span>
                </Label>
                <div className="mt-2">
                  <Button
                    variant="outline"
                    onClick={() => openDateTimePicker(index)}
                    className={`w-full justify-start text-left font-normal h-11 border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900 ${
                      validationErrors[index]?.scheduledAt ? 'border-red-500 focus:ring-red-500' : ''
                    }`}
                  >
                    {lesson.scheduledAt ? (
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {format(lesson.scheduledAt, "PPP 'в' HH:mm", { locale: ru })}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-neutral-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Выберите дату и время
                      </span>
                    )}
                  </Button>
                </div>
                {validationErrors[index]?.scheduledAt && (
                  <p className="text-red-600 text-sm mt-1.5 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {validationErrors[index].scheduledAt}
                  </p>
                )}
              </div>

              <div>
                <Label className="text-neutral-900">Ссылка на урок (опционально)</Label>
                <Input
                  value={lesson.meetLink}
                  onChange={(e) => handleLessonChange(index, "meetLink", e.target.value)}
                  placeholder="https://zoom.us/... или https://telemost.yandex.ru/..."
                  className="mt-2 border-neutral-300 focus:ring-1 focus:ring-black focus:border-black"
                />
                <p className="text-neutral-500 text-xs mt-1.5 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Ссылку можно добавить сейчас или позже в расписании
                </p>
              </div>
            </div>
          </div>
        ))}

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Button
            variant="outline"
            onClick={() => router.push("/my-students")}
            className="border-neutral-300 hover:bg-neutral-100 hover:text-neutral-900"
          >
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-black hover:bg-neutral-800 text-white flex-1 sm:flex-none sm:min-w-[200px]"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Создание...
              </span>
            ) : (
              "Создать расписание"
            )}
          </Button>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Выберите дату и время урока</DialogTitle>
          </DialogHeader>
          
          <div className="grid md:grid-cols-2 gap-8 pt-4">
            <div className="w-full">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => !isDateSelectable(date)}
                locale={ru}
                className="rounded-lg border border-neutral-200 w-full"
                classNames={{
                  selected: "bg-black text-white",
                  today: "bg-neutral-100 font-semibold",
                  disabled: "text-neutral-300 line-through",
                }}
              />
              <p className="text-xs text-neutral-500 mt-3 text-center flex items-center justify-center gap-1">
                <span className="w-2 h-2 rounded-full bg-neutral-300 inline-block"></span>
                Серым отмечены дни без свободного времени
              </p>
            </div>

            <div className="flex flex-col">
              {selectedDate ? (
                <>
                  <Label className="text-base font-semibold mb-4 block text-neutral-900">
                    Доступное время на {format(selectedDate, "dd MMMM yyyy", { locale: ru })}
                  </Label>
                  
                  {hasAvailableHours(selectedDate) ? (
                    <div className="grid grid-cols-3 gap-2">
                      {AVAILABLE_HOURS.map((hour) => {
                        const isAvailable = isHourAvailable(selectedDate, hour);
                        const isSelected = selectedHour === hour;
                        
                        return (
                          <button
                            key={hour}
                            type="button"
                            onClick={() => isAvailable && setSelectedHour(hour)}
                            disabled={!isAvailable}
                            className={`
                              py-3 px-2 rounded-lg text-sm font-medium transition-all duration-200 border
                              ${isAvailable 
                                ? isSelected
                                  ? 'bg-black text-white border-black shadow-sm'
                                  : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300'
                                : 'bg-neutral-50 text-neutral-300 border-neutral-100 cursor-not-allowed line-through'
                              }
                            `}
                          >
                            {hour}:00
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full min-h-[200px] bg-neutral-50 rounded-lg border border-neutral-200 border-dashed">
                      <svg className="w-8 h-8 text-neutral-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-neutral-600 font-medium">Нет свободного времени</p>
                      <p className="text-xs text-neutral-400 mt-1">Выберите другую дату</p>
                    </div>
                  )}

                  {getBusyHoursForDate(selectedDate).length > 0 && (
                    <div className="mt-6 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                      <p className="text-sm text-neutral-700 font-semibold mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Занятое время:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {getBusyHoursForDate(selectedDate).map((hour, i) => (
                          <span key={i} className="text-xs bg-white text-neutral-600 border border-neutral-200 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400"></span>
                            {hour}:00 — {busySlots.find(slot => 
                              isSameDay(new Date(slot.scheduledAt), selectedDate) && 
                              new Date(slot.scheduledAt).getHours() === hour
                            )?.student?.fullname || "Урок"}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[250px] bg-neutral-50 rounded-lg border border-neutral-200 border-dashed">
                  <svg className="w-8 h-8 text-neutral-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-neutral-600 font-medium text-center">
                    Сначала выберите дату<br />в календаре слева
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-3 pt-6 mt-2 border-t border-neutral-200">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 border-neutral-300 hover:bg-neutral-100"
            >
              Отмена
            </Button>
            <Button
              onClick={saveDateTime}
              disabled={!selectedDate || selectedHour === null}
              className="flex-1 bg-black hover:bg-neutral-800 text-white disabled:bg-neutral-300 disabled:cursor-not-allowed"
            >
              Выбрать
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}