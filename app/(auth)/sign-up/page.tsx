"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Role } from "@prisma/client";
import { getCurrentUser } from "@/app/lib/api/user";

interface FormData {
  fullname: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  birthDate: string;
  role: Role;
  passport?: File | null;
  bio?: string;
  medicalDocuments?: File | null;
}

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
};

const months = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
const daysOfWeek = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

type CalendarView = "days" | "months" | "years";

// Обновленный календарь в ваших цветах
const CustomCalendar = ({ selected, onSelect }: { selected?: Date; onSelect: (date: Date) => void }) => {
  const [currentDate, setCurrentDate] = useState(selected || new Date());
  const [view, setView] = useState<CalendarView>("days");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prev = () => {
    if (view === "days") setCurrentDate(new Date(year, month - 1, 1));
    else if (view === "months") setCurrentDate(new Date(year - 1, month, 1));
    else if (view === "years") setCurrentDate(new Date(year - 12, month, 1));
  };

  const next = () => {
    if (view === "days") setCurrentDate(new Date(year, month + 1, 1));
    else if (view === "months") setCurrentDate(new Date(year + 1, month, 1));
    else if (view === "years") setCurrentDate(new Date(year + 12, month, 1));
  };

  const headerTitle = () => {
    if (view === "days") return `${months[month]} ${year}`;
    if (view === "months") return `${year}`;
    const start = year - 4;
    const end = year + 7;
    return `${start} - ${end}`;
  };

  const handleViewToggle = () => {
    if (view === "days") setView("months");
    else if (view === "months") setView("years");
    else setView("days");
  };

  return (
    <div className="p-4 w-72 bg-white">
      <div className="flex justify-between items-center mb-4 px-1">
        <button type="button" onClick={prev} className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-[#a7c2d3]/20 text-[#364954] transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <button 
          type="button" 
          onClick={handleViewToggle} 
          className="text-sm font-bold text-[#364954] hover:text-[#84b1cb] px-2 py-1 rounded-md transition-colors"
        >
          {headerTitle()}
        </button>
        <button type="button" onClick={next} className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-[#a7c2d3]/20 text-[#364954] transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>

      {view === "days" && (
        <>
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {daysOfWeek.map(day => (
              <div key={day} className="text-[0.75rem] font-semibold text-[#364954]/50">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 place-items-center">
            {Array.from({ length: getFirstDayOfMonth(year, month) }).map((_, i) => (
              <div key={`empty-${i}`} className="h-9 w-9" />
            ))}
            {Array.from({ length: getDaysInMonth(year, month) }).map((_, i) => {
              const day = i + 1;
              const date = new Date(year, month, day);
              const isSelected = selected && selected.getDate() === day && selected.getMonth() === month && selected.getFullYear() === year;
              const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
              
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => { onSelect(date); setView("days"); }}
                  className={`h-9 w-9 rounded-full text-sm font-medium transition-all focus:outline-none ${
                    isSelected
                      ? "bg-[#364954] text-white shadow-md scale-105"
                      : isToday
                      ? "bg-[#84b1cb]/20 text-[#364954] font-bold"
                      : "text-[#364954] hover:bg-[#a7c2d3]/20"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </>
      )}

      {view === "months" && (
        <div className="grid grid-cols-3 gap-2">
          {months.map((m, i) => {
            const isSelected = selected && selected.getMonth() === i && selected.getFullYear() === year;
            return (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setCurrentDate(new Date(year, i, 1));
                  setView("days");
                }}
                className={`h-10 rounded-lg text-sm font-medium transition-all ${
                  isSelected ? "bg-[#364954] text-white shadow-md" : "text-[#364954] hover:bg-[#a7c2d3]/20"
                }`}
              >
                {m}
              </button>
            );
          })}
        </div>
      )}

      {view === "years" && (
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 12 }).map((_, i) => {
            const y = year - 4 + i;
            const isSelected = selected && selected.getFullYear() === y;
            return (
              <button
                key={y}
                type="button"
                onClick={() => {
                  setCurrentDate(new Date(y, month, 1));
                  setView("months");
                }}
                className={`h-10 rounded-lg text-sm font-medium transition-all ${
                  isSelected ? "bg-[#364954] text-white shadow-md" : "text-[#364954] hover:bg-[#a7c2d3]/20"
                }`}
              >
                {y}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const SignUp = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role>(Role.STUDENT);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    fullname: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    birthDate: "",
    role: Role.STUDENT,
    passport: null,
    bio: "",
    medicalDocuments: null,
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          router.push("/");
        }
      } catch (error) {
        console.error("Auth error:", error);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    }
  };

  const handleRoleChange = (role: Role) => {
    setSelectedRole(role);
    setFormData((prev) => ({ ...prev, role, passport: null, medicalDocuments: null }));
  };

  const handleDateSelect = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const formatted = `${year}-${month}-${day}`;
    setFormData((prev) => ({ ...prev, birthDate: formatted }));
    setIsCalendarOpen(false);
  };

  const uploadToYandex = async (file: File, folder: string): Promise<string> => {
    const uploadFormData = new FormData();
    uploadFormData.append("file", file);
    uploadFormData.append("folder", folder);
    const response = await fetch("/api/upload", { method: "POST", body: uploadFormData });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Ошибка загрузки файла");
    }
    const data = await response.json();
    return data.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Пароли не совпадают");
      setLoading(false);
      return;
    }
    if (formData.password.length < 6) {
      setError("Пароль должен содержать минимум 6 символов");
      setLoading(false);
      return;
    }

    try {
      let passportUrl = null;
      let medicalDocumentsUrl = null;

      if (selectedRole === Role.TEACHER && formData.passport) {
        passportUrl = await uploadToYandex(formData.passport, "passports");
      }
      if (selectedRole === Role.STUDENT && formData.medicalDocuments) {
        medicalDocumentsUrl = await uploadToYandex(formData.medicalDocuments, "medical");
      }

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullname: formData.fullname,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          birthDate: formData.birthDate,
          role: selectedRole,
          passport: passportUrl,
          bio: selectedRole === Role.TEACHER ? formData.bio : undefined,
          medicalDocuments: medicalDocumentsUrl,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Ошибка регистрации");

      const signInResult = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (signInResult?.error) {
        router.push("/sign-in?registered=true");
      } else {
        router.push("/");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка");
    } finally {
      setLoading(false);
    }
  };

  const displayDate = formData.birthDate 
    ? new Date(formData.birthDate).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })
    : "Выберите дату";

  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-4 sm:px-6 lg:px-8 font-sans text-[#364954]">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-xl border border-[#a7c2d3]/20 overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#364954] px-8 py-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('/images/drone-pattern.png')] opacity-5"></div>
          <h1 className="text-3xl font-bold text-white tracking-tight relative z-10">Регистрация</h1>
          <p className="text-[#a7c2d3] mt-2 relative z-10">Присоединяйтесь к школе EDrone</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-start text-sm animate-in fade-in slide-in-from-top-2">
              <svg className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-bold text-[#364954] mb-3 uppercase tracking-wide">
                Кто вы?
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleRoleChange(Role.STUDENT)}
                  className={`relative p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center text-center group ${
                    selectedRole === Role.STUDENT
                      ? "border-[#364954] bg-[#364954]/5 shadow-md"
                      : "border-[#a7c2d3]/30 hover:border-[#84b1cb] bg-white"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${
                    selectedRole === Role.STUDENT ? "bg-[#364954] text-white" : "bg-[#a7c2d3]/20 text-[#364954]"
                  }`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                    </svg>
                  </div>
                  <div className={`font-bold ${selectedRole === Role.STUDENT ? "text-[#364954]" : "text-[#364954]/70"}`}>Ученик</div>
                  <div className="text-xs text-[#364954]/50 mt-1">Хочу научиться летать</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleChange(Role.TEACHER)}
                  className={`relative p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center text-center group ${
                    selectedRole === Role.TEACHER
                      ? "border-[#364954] bg-[#364954]/5 shadow-md"
                      : "border-[#a7c2d3]/30 hover:border-[#84b1cb] bg-white"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${
                    selectedRole === Role.TEACHER ? "bg-[#364954] text-white" : "bg-[#a7c2d3]/20 text-[#364954]"
                  }`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  <div className={`font-bold ${selectedRole === Role.TEACHER ? "text-[#364954]" : "text-[#364954]/70"}`}>Тренер</div>
                  <div className="text-xs text-[#364954]/50 mt-1">Хочу обучать других</div>
                </button>
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-[#364954] mb-1.5">ФИО</label>
                <input
                  type="text"
                  name="fullname"
                  required
                  value={formData.fullname}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-[#f8fafc] border border-[#a7c2d3]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#84b1cb] focus:border-transparent transition-all text-[#364954]"
                  placeholder="Иванов Иван Иванович"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#364954] mb-1.5">Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-[#f8fafc] border border-[#a7c2d3]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#84b1cb] focus:border-transparent transition-all text-[#364954]"
                  placeholder="example@mail.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#364954] mb-1.5">Телефон</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-[#f8fafc] border border-[#a7c2d3]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#84b1cb] focus:border-transparent transition-all text-[#364954]"
                  placeholder="+7 (999) 000-00-00"
                />
              </div>

              {/* Calendar Input */}
              <div className="md:col-span-2 relative">
                <label className="block text-sm font-semibold text-[#364954] mb-1.5">Дата рождения</label>
                <button
                  type="button"
                  onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                  className={`w-full flex items-center justify-between px-4 py-3 bg-[#f8fafc] border rounded-xl transition-all text-left ${
                    isCalendarOpen ? "border-[#84b1cb] ring-2 ring-[#84b1cb]/20" : "border-[#a7c2d3]/30"
                  }`}
                >
                  <span className={formData.birthDate ? "text-[#364954]" : "text-[#364954]/50"}>
                    {displayDate}
                  </span>
                  <svg className="h-5 w-5 text-[#84b1cb]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" strokeWidth="2"/>
                    <line x1="16" x2="16" y1="2" y2="6" strokeWidth="2"/>
                    <line x1="8" x2="8" y1="2" y2="6" strokeWidth="2"/>
                    <line x1="3" x2="21" y1="10" y2="10" strokeWidth="2"/>
                  </svg>
                </button>
                
                {isCalendarOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsCalendarOpen(false)} />
                    <div className="absolute z-50 mt-2 w-auto rounded-xl border border-[#a7c2d3]/20 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200 origin-top-left">
                      <CustomCalendar
                        selected={formData.birthDate ? new Date(formData.birthDate) : undefined}
                        onSelect={handleDateSelect}
                      />
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#364954] mb-1.5">Пароль</label>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-[#f8fafc] border border-[#a7c2d3]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#84b1cb] focus:border-transparent transition-all text-[#364954]"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#364954] mb-1.5">Подтверждение</label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-[#f8fafc] border border-[#a7c2d3]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#84b1cb] focus:border-transparent transition-all text-[#364954]"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Conditional Fields */}
            <div className="pt-4 border-t border-[#a7c2d3]/20">
              {selectedRole === Role.TEACHER && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div>
                    <label className="block text-sm font-bold text-[#364954] mb-2">Паспортные данные</label>
                    <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-[#a7c2d3] rounded-xl cursor-pointer hover:bg-[#a7c2d3]/5 hover:border-[#84b1cb] transition-all group">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <div className="w-10 h-10 rounded-full bg-[#a7c2d3]/20 text-[#364954] flex items-center justify-center mb-2 group-hover:bg-[#84b1cb] group-hover:text-white transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                        </div>
                        <p className="text-sm text-[#364954] font-medium">
                          {formData.passport ? formData.passport.name : "Загрузить скан или фото"}
                        </p>
                        <p className="text-xs text-[#364954]/50 mt-1">PNG, JPG или PDF</p>
                      </div>
                      <input type="file" name="passport" className="hidden" accept="image/*,.pdf" onChange={handleFileChange} required />
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#364954] mb-2">О себе и опыт</label>
                    <textarea
                      name="bio"
                      rows={4}
                      value={formData.bio}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-[#f8fafc] border border-[#a7c2d3]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#84b1cb] focus:border-transparent transition-all text-[#364954] resize-none"
                      placeholder="Расскажите о вашем опыте пилотирования..."
                    />
                  </div>
                </div>
              )}

              {selectedRole === Role.STUDENT && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <label className="block text-sm font-bold text-[#364954] mb-2">Медицинская справка (опционально)</label>
                  <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-[#a7c2d3] rounded-xl cursor-pointer hover:bg-[#a7c2d3]/5 hover:border-[#84b1cb] transition-all group">
                    <div className="flex flex-col items-center justify-center">
                       <p className="text-sm text-[#364954] font-medium">
                        {formData.medicalDocuments ? formData.medicalDocuments.name : "Загрузить документ"}
                      </p>
                      <p className="text-xs text-[#364954]/50 mt-1">Если есть противопоказания</p>
                    </div>
                    <input type="file" name="medicalDocuments" className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
                  </label>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#364954] text-white py-4 px-4 rounded-xl hover:bg-[#84b1cb] transition-all duration-300 disabled:bg-[#a7c2d3] disabled:cursor-not-allowed font-bold text-lg shadow-lg shadow-[#364954]/20 transform active:scale-[0.98]"
            >
              {loading ? "Создание аккаунта..." : "Зарегистрироваться"}
            </button>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-[#a7c2d3]/20">
            <p className="text-sm text-[#364954]/70">
              Уже есть аккаунт?{" "}
              <a href="/sign-in" className="text-[#364954] font-bold hover:text-[#84b1cb] underline decoration-2 underline-offset-2 transition-all">
                Войти в систему
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;