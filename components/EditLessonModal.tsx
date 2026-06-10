// app/components/EditLessonModal.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Lesson {
  id: string;
  lessonNumber: number;
  topic: string;
  scheduledAt: string;
  meetLink: string | null;
  status: string;
}

interface EditLessonModalProps {
  lesson: Lesson | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function EditLessonModal({ lesson, isOpen, onClose, onUpdate }: EditLessonModalProps) {
  const [topic, setTopic] = useState("");
  const [scheduledAt, setScheduledAt] = useState<Date | undefined>(undefined);
  const [meetLink, setMeetLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (lesson) {
      setTopic(lesson.topic);
      setScheduledAt(new Date(lesson.scheduledAt));
      setMeetLink(lesson.meetLink || "");
    }
  }, [lesson]);

  const handleSubmit = async () => {
    if (!topic.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите тему урока",
        variant: "destructive",
      });
      return;
    }

    if (!scheduledAt) {
      toast({
        title: "Ошибка",
        description: "Выберите дату и время урока",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/teacher/update-lesson", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: lesson?.id,
          topic,
          scheduledAt: scheduledAt.toISOString(),
          meetLink: meetLink || null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Успешно",
          description: "Урок обновлен. Ученик получит уведомление на email.",
        });
        onUpdate();
        onClose();
      } else {
        toast({
          title: "Ошибка",
          description: result.error || "Не удалось обновить урок",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Update error:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить урок",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!lesson) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Редактировать урок №{lesson.lessonNumber}</DialogTitle>
          <DialogDescription>
            Измените данные урока. Ученик получит уведомление на email о всех изменениях.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Тема урока *</Label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Введите тему урока"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Дата и время *</Label>
            <div className="mt-1">
              <Button
                variant="outline"
                onClick={() => setShowCalendar(!showCalendar)}
                className="w-full justify-start text-left font-normal"
              >
                {scheduledAt ? (
                  format(scheduledAt, "PPP 'в' HH:mm", { locale: ru })
                ) : (
                  "Выберите дату и время"
                )}
              </Button>
            </div>
            
            {showCalendar && (
              <div className="border rounded-lg p-4 bg-gray-50 mt-2">
                <Calendar
                  mode="single"
                  selected={scheduledAt}
                  onSelect={(date) => {
                    if (date) {
                      const newDate = new Date(date);
                      if (scheduledAt) {
                        newDate.setHours(scheduledAt.getHours(), scheduledAt.getMinutes());
                      }
                      setScheduledAt(newDate);
                    }
                  }}
                  locale={ru}
                  className="rounded-md border"
                />
                <div className="mt-4">
                  <Input
                    type="time"
                    value={scheduledAt ? format(scheduledAt, "HH:mm") : ""}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value.split(":");
                      if (scheduledAt) {
                        const newDate = new Date(scheduledAt);
                        newDate.setHours(parseInt(hours), parseInt(minutes));
                        setScheduledAt(newDate);
                      }
                    }}
                    className="mt-2"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <Label>Ссылка на урок (опционально)</Label>
            <Input
              value={meetLink}
              onChange={(e) => setMeetLink(e.target.value)}
              placeholder="https://zoom.us/... или https://telemost.yandex.ru/..."
              className="mt-1"
            />
            <p className="text-gray-400 text-xs mt-1">
              Если добавить или изменить ссылку, ученик получит уведомление
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Отмена
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-gray-900 hover:bg-gray-800"
            >
              {loading ? "Сохранение..." : "Сохранить изменения"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}