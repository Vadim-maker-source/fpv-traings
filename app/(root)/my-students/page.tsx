"use client";

import { getCurrentUser } from "@/app/lib/api/user";
import { UserType } from "@/app/lib/types";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface StudentListItem {
  id: string;
  fullname: string;
  email: string;
  medicalDocuments: string | null;
}

const searchStudents = async (query: string): Promise<UserType[]> => {
  const response = await fetch(`/api/users/search?role=STUDENT&q=${query}`);
  const data = await response.json();
  return data.users;
};

const addStudentToTeacher = async (studentId: string) => {
  const response = await fetch("/api/teacher/add-student", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentId }),
  });
  return response.json();
};

export default function MyStudentsPage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserType[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [addingStudent, setAddingStudent] = useState<string | null>(null);
  const [studentToRemove, setStudentToRemove] = useState<StudentListItem | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await getCurrentUser();
      if (currentUser && currentUser.role === Role.TEACHER) {
        setUser(currentUser);
      } else {
        router.push("/sign-in");
      }
      setLoading(false);
    };
    loadUser();
  }, [router]);

  const performSearch = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchStudents(query);
      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось выполнить поиск",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  }, [toast]);

  const handleSearchInput = useCallback((value: string) => {
    setSearchQuery(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!value || value.length < 2) {
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(value);
    }, 500);
  }, [performSearch]);

  const handleAddStudent = async (student: UserType) => {
    setAddingStudent(student.id);
    try {
      const result = await addStudentToTeacher(student.id);
      
      if (result.success) {
        toast({
          title: "Успешно",
          description: `${student.fullname} добавлен в ваши ученики`,
        });
        
        setUser(prev => prev ? {
          ...prev,
          students: [...(prev.students || []), { 
            id: student.id,
            fullname: student.fullname,
            email: student.email,
            medicalDocuments: student.medicalDocuments || null
          }]
        } : prev);
        
        setSearchQuery("");
        setSearchResults([]);
        setIsDialogOpen(false);
      } else {
        toast({
          title: "Ошибка",
          description: result.error || "Не удалось добавить ученика",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Add student error:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить ученика",
        variant: "destructive",
      });
    } finally {
      setAddingStudent(null);
    }
  };

  const handleRemoveClick = (student: StudentListItem) => {
    setStudentToRemove(student);
  };

  const handleConfirmRemove = async () => {
    if (!studentToRemove) return;

    setIsRemoving(true);
    try {
      const response = await fetch("/api/teacher/remove-student", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: studentToRemove.id }),
      });
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Успешно",
          description: `${studentToRemove.fullname} удален из ваших учеников. Все уроки с этим учеником также удалены.`,
        });
        
        setUser(prev => prev ? {
          ...prev,
          students: prev.students?.filter(s => s.id !== studentToRemove.id)
        } : prev);
      } else {
        toast({
          title: "Ошибка",
          description: result.error || "Не удалось удалить ученика",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Remove student error:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить ученика",
        variant: "destructive",
      });
    } finally {
      setIsRemoving(false);
      setStudentToRemove(null);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setSearchQuery("");
      setSearchResults([]);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

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

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Мои ученики</h1>
          <p className="text-neutral-500 mt-1">Всего: {user.students?.length || 0}</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="bg-black hover:bg-neutral-800 text-white font-medium px-6">
              Добавить ученика
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Добавить ученика</DialogTitle>
              <DialogDescription>
                Найдите ученика без тренера по имени или email
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <Input
                placeholder="Поиск по имени или email..."
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                className="w-full focus:ring-1 focus:ring-black focus:border-black"
              />
              
              <ScrollArea className="h-[300px] pr-4">
                {isSearching ? (
                  <div className="flex justify-center py-8">
                    <div className="text-neutral-500">Поиск...</div>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-2">
                    {searchResults.map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-neutral-900 text-white text-sm font-medium">
                              {student.fullname.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-neutral-900">{student.fullname}</p>
                            <p className="text-sm text-neutral-500">{student.email}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAddStudent(student)}
                          disabled={addingStudent === student.id}
                          className="bg-black hover:bg-neutral-800 text-white"
                        >
                          {addingStudent === student.id ? "..." : "Добавить"}
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : searchQuery.length >= 2 ? (
                  <div className="text-center py-8 text-neutral-500">
                    Не найдено учеников без тренера
                  </div>
                ) : (
                  <div className="text-center py-8 text-neutral-500">
                    Введите минимум 2 символа для поиска
                  </div>
                )}
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {user.students && user.students.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {user.students.map((student) => (
            <div
              key={student.id}
              className="bg-white rounded-xl border border-neutral-200 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div 
                    className="flex items-center gap-3 cursor-pointer group flex-1"
                    onClick={() => router.push(`/profile/${student.id}`)}
                  >
                    <Avatar className="h-12 w-12 border border-neutral-100">
                      <AvatarFallback className="bg-neutral-900 text-white text-lg font-medium">
                        {student.fullname.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-neutral-900 group-hover:underline transition-colors">
                        {student.fullname}
                      </h3>
                      <p className="text-sm text-neutral-500">{student.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveClick(student);
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                </div>
                
                <div className="mt-5 pt-4 border-t border-neutral-100 flex flex-col gap-2">
                  <button
                    onClick={() => router.push(`/my-students/schedule/${student.id}`)}
                    className="w-full text-sm font-medium bg-black text-white px-4 py-2.5 rounded-lg hover:bg-neutral-800 transition-colors"
                  >
                    Создать расписание
                  </button>
                  <button
                    onClick={() => router.push(`/my-students/schedule/view/${student.id}`)}
                    className="w-full text-sm font-medium bg-neutral-100 text-neutral-900 px-4 py-2.5 rounded-lg hover:bg-neutral-200 transition-colors"
                  >
                    Посмотреть расписание
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-neutral-50 rounded-xl border border-neutral-200 border-dashed">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100 mb-4">
            <svg className="w-6 h-6 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <p className="text-neutral-900 font-medium">У вас пока нет учеников</p>
          <p className="text-sm text-neutral-500 mt-1">
            Нажмите "Добавить ученика", чтобы начать
          </p>
        </div>
      )}

      <AlertDialog open={!!studentToRemove} onOpenChange={() => setStudentToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
            <AlertDialogDescription>
              Ученик <span className="font-semibold text-neutral-900">{studentToRemove?.fullname}</span> будет удален из вашего списка.
              <br /><br />
              <span className="text-red-600 font-semibold">ВНИМАНИЕ:</span> Все уроки с этим учеником будут также удалены. 
              Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemove}
              disabled={isRemoving}
              className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600"
            >
              {isRemoving ? "Удаление..." : "Да, удалить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}