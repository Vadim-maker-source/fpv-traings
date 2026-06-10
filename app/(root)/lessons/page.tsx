"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/app/lib/api/user";
import { UserType } from "@/app/lib/types";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Clock,
  Video,
  User,
  BookOpen,
  ChevronRight,
  CalendarDays,
} from "lucide-react";

interface Lesson {
  id: string;
  lessonNumber: number;
  topic: string;
  scheduledAt: string;
  meetLink: string | null;
  status: string;
  teacher: {
    fullname: string;
    email: string;
  };
}

export default function LessonsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<UserType | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [upcomingLessons, setUpcomingLessons] = useState<Lesson[]>([]);
  const [pastLessons, setPastLessons] = useState<Lesson[]>([]);
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
        
        if (currentUser.role !== "STUDENT") {
          toast({
            title: "Доступ запрещен",
            description: "Только ученики могут просматривать расписание",
            variant: "destructive",
          });
          router.replace("/dashboard");
          return;
        }
        
        setUser(currentUser);

        const lessonsResponse = await fetch(`/api/lessons/student/${currentUser.id}`);
        const lessonsData = await lessonsResponse.json();
        
        const allLessons = lessonsData.lessons || [];
        
        const now = new Date();
        const upcoming = allLessons.filter(
          (lesson: Lesson) => new Date(lesson.scheduledAt) > now
        ).sort((a: Lesson, b: Lesson) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
        
        const past = allLessons.filter(
          (lesson: Lesson) => new Date(lesson.scheduledAt) <= now
        ).sort((a: Lesson, b: Lesson) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
        
        setUpcomingLessons(upcoming);
        setPastLessons(past);
        setLessons(allLessons);
      } catch (error) {
        console.error("Load lessons error:", error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить расписание",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router, toast]);

  const getStatusBadge = (status: string, scheduledAt: string) => {
    const now = new Date();
    const lessonDate = new Date(scheduledAt);
    
    if (status === "COMPLETED") {
      return <Badge variant="outline" className="border-gray-400 text-gray-600">Проведен</Badge>;
    }
    
    if (lessonDate < now) {
      return <Badge variant="secondary" className="bg-gray-200 text-gray-700">Просрочен</Badge>;
    }
    
    return <Badge className="bg-black text-white hover:bg-gray-800">Запланирован</Badge>;
  };

  const getDaysUntil = (date: string) => {
    const now = new Date();
    const lessonDate = new Date(date);
    const diffTime = lessonDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Сегодня";
    if (diffDays === 1) return "Завтра";
    if (diffDays < 0) return "Прошел";
    return `Через ${diffDays} дн.`;
  };

  if (loading) {
    return (
      <div className="container max-w-6xl mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Мои уроки</h1>
        <p className="text-gray-500">
          {user.fullname}, у вас {upcomingLessons.length} предстоящих урока(ов)
        </p>
      </div>

      {/* Upcoming Lessons */}
      {upcomingLessons.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-gray-200" />
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CalendarDays className="w-5 h-5" />
              Предстоящие уроки
            </h2>
            <div className="h-px flex-1 bg-gray-200" />
          </div>
          
          <div className="space-y-3">
            {upcomingLessons.map((lesson) => (
              <Card key={lesson.id} className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="p-5">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-gray-500" />
                            <span className="font-semibold text-gray-900">
                              Урок {lesson.lessonNumber}
                            </span>
                          </div>
                          {getStatusBadge(lesson.status, lesson.scheduledAt)}
                        </div>
                        
                        <p className="text-gray-700">
                          <span className="font-medium text-gray-900">Тема:</span> {lesson.topic}
                        </p>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <User className="w-4 h-4" />
                          <span>{lesson.teacher?.fullname || "Не указан"}</span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>{format(new Date(lesson.scheduledAt), "PPP", { locale: ru })}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>{format(new Date(lesson.scheduledAt), "HH:mm", { locale: ru })}</span>
                          </div>
                          <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                            {getDaysUntil(lesson.scheduledAt)}
                          </Badge>
                        </div>
                      </div>
                      
                      {lesson.meetLink && (
                        <Button asChild className="bg-black text-white hover:bg-gray-800 shadow-none">
                          <a href={lesson.meetLink} target="_blank" rel="noopener noreferrer">
                            <Video className="w-4 h-4 mr-2" />
                            Присоединиться
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Past Lessons */}
      {pastLessons.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-gray-200" />
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Прошедшие уроки
            </h2>
            <div className="h-px flex-1 bg-gray-200" />
          </div>
          
          <div className="space-y-2">
            {pastLessons.map((lesson) => (
              <Card key={lesson.id} className="border-gray-200 bg-gray-50/50">
                <CardContent className="p-0">
                  <div className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-medium text-gray-900">Урок {lesson.lessonNumber}</span>
                          {getStatusBadge(lesson.status, lesson.scheduledAt)}
                        </div>
                        <p className="text-sm text-gray-600">{lesson.topic}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span>{format(new Date(lesson.scheduledAt), "PPP", { locale: ru })}</span>
                          <span>•</span>
                          <span>{format(new Date(lesson.scheduledAt), "HH:mm", { locale: ru })}</span>
                        </div>
                      </div>
                      
                      {lesson.meetLink && lesson.status !== "COMPLETED" && (
                        <Button variant="ghost" size="sm" asChild className="text-gray-600">
                          <a href={lesson.meetLink} target="_blank" rel="noopener noreferrer">
                            Материалы
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {lessons.length === 0 && (
        <Card className="border-gray-200 bg-gray-50/30">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-gray-400" />
            </div>
            <CardTitle className="text-xl text-gray-900 mb-2">У вас пока нет уроков</CardTitle>
            <CardDescription className="text-gray-500 text-center">
              Когда тренер назначит уроки, они появятся здесь
            </CardDescription>
          </CardContent>
        </Card>
      )}
    </div>
  );
}