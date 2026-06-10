import { Role } from "@prisma/client";

export interface UserType {
  id: string;
  fullname: string;
  email: string;
  phone: string | null;
  birthDate: string | null;
  role: Role;
  isChecked: boolean;
  bio: string | null;
  passport: string | null;
  medicalDocuments: string | null;
  createdAt: Date | string;
  teacherId: string | null;
  teacher?: {
    id: string;
    fullname: string;
    email: string;
    bio: string | null;
    isChecked: boolean; // ✅ Добавлено поле isChecked
  } | null;
  students?: {
    id: string;
    fullname: string;
    email: string;
    medicalDocuments: string | null;
  }[];
  studentLessons?: any[];
  teacherLessons?: any[];
  gameStats?: any[];
  supportTickets?: any[];
}