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
    <div className="p-3 w-72">
      <div className="flex justify-between items-center mb-4">
        <button type="button" onClick={prev} className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-neutral-100 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <button 
          type="button" 
          onClick={handleViewToggle} 
          className="text-sm font-semibold text-neutral-900 hover:bg-neutral-100 px-2 py-1 rounded-md transition-colors"
        >
          {headerTitle()}
        </button>
        <button type="button" onClick={next} className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-neutral-100 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>

      {view === "days" && (
        <>
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {daysOfWeek.map(day => (
              <div key={day} className="text-[0.8rem] font-medium text-neutral-500">{day}</div>
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
                  className={`h-9 w-9 rounded-md text-sm font-normal transition-colors focus:outline-none focus:ring-2 focus:ring-black ${
                    isSelected
                      ? "bg-black text-white hover:bg-neutral-800"
                      : isToday
                      ? "bg-neutral-100 text-black font-semibold"
                      : "text-neutral-900 hover:bg-neutral-100"
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
            const isCurrent = new Date().getMonth() === i && new Date().getFullYear() === year;
            return (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setCurrentDate(new Date(year, i, 1));
                  setView("days");
                }}
                className={`h-9 rounded-md text-sm font-normal transition-colors focus:outline-none focus:ring-2 focus:ring-black ${
                  isSelected ? "bg-black text-white hover:bg-neutral-800" : isCurrent ? "bg-neutral-100 text-black font-semibold" : "text-neutral-900 hover:bg-neutral-100"
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
            const isCurrent = new Date().getFullYear() === y;
            return (
              <button
                key={y}
                type="button"
                onClick={() => {
                  setCurrentDate(new Date(y, month, 1));
                  setView("months");
                }}
                className={`h-9 rounded-md text-sm font-normal transition-colors focus:outline-none focus:ring-2 focus:ring-black ${
                  isSelected ? "bg-black text-white hover:bg-neutral-800" : isCurrent ? "bg-neutral-100 text-black font-semibold" : "text-neutral-900 hover:bg-neutral-100"
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
        router.push("/sign-in");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
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

    const response = await fetch("/api/upload", {
      method: "POST",
      body: uploadFormData,
    });

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
        medicalDocumentsUrl = await uploadToYandex(
          formData.medicalDocuments,
          "medical"
        );
      }

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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

      if (!response.ok) {
        throw new Error(data.error || "Ошибка регистрации");
      }

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
    <div className="min-h-screen bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm border border-neutral-200 p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Регистрация</h1>
          <p className="text-neutral-500 mt-2">Создайте новый аккаунт</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-neutral-900 text-white rounded-lg flex items-start text-sm">
            <svg className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-3">
              Выберите роль
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleRoleChange(Role.STUDENT)}
                className={`p-4 border-2 rounded-xl transition-all flex flex-col items-center text-center ${
                  selectedRole === Role.STUDENT
                    ? "border-black bg-black text-white shadow-md"
                    : "border-neutral-200 hover:border-neutral-400 text-neutral-700 bg-white"
                }`}
                aria-label="Выбрать роль ученика"
              >
                <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                </svg>
                <div className="font-semibold">Ученик</div>
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange(Role.TEACHER)}
                className={`p-4 border-2 rounded-xl transition-all flex flex-col items-center text-center ${
                  selectedRole === Role.TEACHER
                    ? "border-black bg-black text-white shadow-md"
                    : "border-neutral-200 hover:border-neutral-400 text-neutral-700 bg-white"
                }`}
                aria-label="Выбрать роль тренера"
              >
                <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11l2 2 4-4"></path>
                </svg>
                <div className="font-semibold">Тренер</div>
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="fullname" className="block text-sm font-semibold text-neutral-900 mb-1.5">
              ФИО *
            </label>
            <input
              id="fullname"
              type="text"
              name="fullname"
              required
              value={formData.fullname}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all bg-white text-neutral-900 placeholder-neutral-400"
              placeholder="Иванов Иван Иванович"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-neutral-900 mb-1.5">
              Email *
            </label>
            <input
              id="email"
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all bg-white text-neutral-900 placeholder-neutral-400"
              placeholder="ivan@example.com"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-semibold text-neutral-900 mb-1.5">
              Телефон *
            </label>
            <input
              id="phone"
              type="tel"
              name="phone"
              required
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all bg-white text-neutral-900 placeholder-neutral-400"
              placeholder="+7 (999) 123-45-67"
            />
          </div>

          <div>
            <label htmlFor="birthDate" className="block text-sm font-semibold text-neutral-900 mb-1.5">
              Дата рождения *
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                className="w-full flex items-center justify-between px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all bg-white text-neutral-900"
              >
                <span className={formData.birthDate ? "text-neutral-900" : "text-neutral-400"}>
                  {displayDate}
                </span>
                <svg className="h-5 w-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2" strokeWidth="2"/>
                  <line x1="16" x2="16" y1="2" y2="6" strokeWidth="2"/>
                  <line x1="8" x2="8" y1="2" y2="6" strokeWidth="2"/>
                  <line x1="3" x2="21" y1="10" y2="10" strokeWidth="2"/>
                </svg>
              </button>
              
              {isCalendarOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsCalendarOpen(false)} />
                  <div className="absolute z-50 mt-2 w-auto rounded-xl border border-neutral-200 bg-white shadow-xl">
                    <CustomCalendar
                      selected={formData.birthDate ? new Date(formData.birthDate) : undefined}
                      onSelect={handleDateSelect}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-neutral-900 mb-1.5">
              Пароль *
            </label>
            <input
              id="password"
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all bg-white text-neutral-900 placeholder-neutral-400"
              placeholder="Минимум 6 символов"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-neutral-900 mb-1.5">
              Подтверждение пароля *
            </label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              required
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all bg-white text-neutral-900 placeholder-neutral-400"
              placeholder="Повторите пароль"
            />
          </div>

          {selectedRole === Role.TEACHER && (
            <>
              <div>
                <label htmlFor="passport" className="block text-sm font-semibold text-neutral-900 mb-1.5">
                  Паспорт (скан/фото) *
                </label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-neutral-300 rounded-xl cursor-pointer hover:bg-neutral-50 hover:border-neutral-400 transition-all">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-8 h-8 mb-2 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                    <p className="text-sm text-neutral-600">
                      <span className="font-semibold">Нажмите для загрузки</span>
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
                      {formData.passport ? formData.passport.name : "PNG, JPG или PDF"}
                    </p>
                  </div>
                  <input id="passport" type="file" name="passport" className="hidden" accept="image/*,.pdf" onChange={handleFileChange} required />
                </label>
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-semibold text-neutral-900 mb-1.5">
                  О себе / Опыт работы
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  value={formData.bio}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all bg-white text-neutral-900 placeholder-neutral-400 resize-none"
                  placeholder="Расскажите о своем опыте, достижениях, методике обучения..."
                />
              </div>
            </>
          )}

          {selectedRole === Role.STUDENT && (
            <div>
              <label htmlFor="medicalDocuments" className="block text-sm font-semibold text-neutral-900 mb-1.5">
                Медицинские документы (справки)
              </label>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-neutral-300 rounded-xl cursor-pointer hover:bg-neutral-50 hover:border-neutral-400 transition-all">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-8 h-8 mb-2 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  <p className="text-sm text-neutral-600">
                    <span className="font-semibold">Нажмите для загрузки</span>
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">
                    {formData.medicalDocuments ? formData.medicalDocuments.name : "Медицинские справки (если есть)"}
                  </p>
                </div>
                <input id="medicalDocuments" type="file" name="medicalDocuments" className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 px-4 rounded-lg hover:bg-neutral-800 transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed font-semibold text-base shadow-sm"
          >
            {loading ? "Регистрация..." : "Зарегистрироваться"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-neutral-600">
            Уже есть аккаунт?{" "}
            <a href="/sign-in" className="text-black font-semibold hover:underline transition-all">
              Войти
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
