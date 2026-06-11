import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false
  },
  pool: true,
  maxConnections: 1,
  rateDelta: 1000,
  rateLimit: 5,
});

export interface LessonChangeDetails {
  lessonNumber: number;
  topic?: string;
  oldTopic?: string;
  newTopic?: string;
  scheduledAt?: Date;
  oldDate?: Date;
  newDate?: Date;
  meetLink?: string;
  oldMeetLink?: string;
  newMeetLink?: string;
}

export async function sendLessonUpdateEmail(
  studentEmail: string,
  studentName: string,
  teacherName: string,
  lessonNumber: number,
  changes: LessonChangeDetails
) {
  const changeDescriptions = [];
  
  if (changes.topic && changes.oldTopic !== changes.newTopic) {
    changeDescriptions.push(`• Тема урока изменена с "${changes.oldTopic}" на "${changes.newTopic}"`);
  }
  
  if (changes.scheduledAt && changes.oldDate !== changes.newDate) {
    changeDescriptions.push(`• Дата и время изменены с ${formatDate(changes.oldDate)} на ${formatDate(changes.newDate)}`);
  }
  
  if (changes.meetLink && changes.oldMeetLink !== changes.newMeetLink) {
    if (changes.newMeetLink) {
      changeDescriptions.push(`• Добавлена ссылка для подключения: ${changes.newMeetLink}`);
    } else {
      changeDescriptions.push(`• Ссылка для подключения удалена`);
    }
  }
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h2 style="color: #1f2937; margin: 0;">Изменение в расписании</h2>
      </div>
      
      <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="color: #374151; font-size: 16px;">Здравствуйте, <strong>${studentName}</strong>!</p>
        
        <p style="color: #374151; font-size: 16px;">Преподаватель <strong>${teacherName}</strong> внес изменения в урок №${lessonNumber}:</p>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-top: 0;">Изменения:</h3>
          <ul style="color: #4b5563; margin-bottom: 0;">
            ${changeDescriptions.map(desc => `<li style="margin-bottom: 8px;">${desc}</li>`).join('')}
          </ul>
        </div>
        
        <p style="color: #374151; font-size: 16px;">
          Пожалуйста, проверьте обновленное расписание в личном кабинете.
        </p>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.NEXTAUTH_URL}/lessons" 
             style="background-color: #1f2937; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
            Перейти к расписанию
          </a>
        </div>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; color: #6b7280; font-size: 12px;">
        <p style="margin: 0;">Это письмо было отправлено автоматически. Пожалуйста, не отвечайте на него.</p>
      </div>
    </div>
  `;
  
  const text = `
    Изменение в расписании
    
    Здравствуйте, ${studentName}!
    
    Преподаватель ${teacherName} внес изменения в урок №${lessonNumber}:
    
    ${changeDescriptions.join('\n')}
    
    Пожалуйста, проверьте обновленное расписание в личном кабинете: ${process.env.NEXTAUTH_URL}/lessons
  `;
  
  try {
    await transporter.sendMail({
      from: `"Образовательная платформа" <${process.env.GMAIL_USER}>`,
      to: studentEmail,
      subject: `Изменение в уроке №${lessonNumber}`,
      text,
      html,
    });
    console.log(`Email sent to ${studentEmail}`);
  } catch (error) {
    console.error("Email sending error:", error);
    throw error;
  }
}

export async function sendStudentAddedEmail(
  studentEmail: string,
  studentName: string,
  teacherName: string
) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #1f2937; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h2 style="color: white; margin: 0;">Добро пожаловать!</h2>
      </div>
      
      <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="color: #374151; font-size: 16px;">Здравствуйте, <strong>${studentName}</strong>!</p>
        
        <p style="color: #374151; font-size: 16px;">
          Преподаватель <strong>${teacherName}</strong> добавил вас в список своих учеников.
        </p>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-top: 0;">Что это значит?</h3>
          <ul style="color: #4b5563; margin-bottom: 0;">
            <li style="margin-bottom: 8px;">✓ Теперь вы можете видеть расписание уроков, назначенных этим преподавателем</li>
            <li style="margin-bottom: 8px;">✓ Вы будете получать уведомления об изменениях в расписании</li>
            <li style="margin-bottom: 8px;">✓ Преподаватель сможет отслеживать ваш прогресс</li>
          </ul>
        </div>
        
        <p style="color: #374151; font-size: 16px;">
          Если уроки еще не назначены, они скоро появятся в вашем личном кабинете.
        </p>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.NEXTAUTH_URL}/lessons" 
             style="background-color: #1f2937; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
            Перейти к расписанию
          </a>
        </div>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; color: #6b7280; font-size: 12px;">
        <p style="margin: 0;">Это письмо было отправлено автоматически. Пожалуйста, не отвечайте на него.</p>
      </div>
    </div>
  `;
  
  const text = `
    Добро пожаловать!
    
    Здравствуйте, ${studentName}!
    
    Преподаватель ${teacherName} добавил вас в список своих учеников.
    
    Что это значит?
    - Теперь вы можете видеть расписание уроков, назначенных этим преподавателем
    - Вы будете получать уведомления об изменениях в расписании
    - Преподаватель сможет отслеживать ваш прогресс
    
    Если уроки еще не назначены, они скоро появятся в вашем личном кабинете: ${process.env.NEXTAUTH_URL}/lessons
  `;
  
  try {
    await transporter.sendMail({
      from: `"Образовательная платформа" <${process.env.GMAIL_USER}>`,
      to: studentEmail,
      subject: `Вас добавил преподаватель ${teacherName}`,
      text,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error("Email sending error:", error);
    throw error;
  }
}

// НОВАЯ ФУНКЦИЯ: Уведомление тренера о заявке от ученика
export async function sendTeacherApplicationEmail(
  teacherEmail: string,
  teacherName: string,
  studentName: string,
  studentEmail: string
) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #364954; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h2 style="color: white; margin: 0;">Новая заявка на обучение</h2>
      </div>
      
      <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="color: #374151; font-size: 16px;">Здравствуйте, <strong>${teacherName}</strong>!</p>
        
        <p style="color: #374151; font-size: 16px;">
          Ученик <strong>${studentName}</strong> хочет записаться к вам на занятия.
        </p>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-top: 0;">Контакты ученика:</h3>
          <p style="color: #4b5563; margin-bottom: 0; font-size: 16px;">
            📧 Email: <a href="mailto:${studentEmail}" style="color: #364954; text-decoration: underline;">${studentEmail}</a>
          </p>
        </div>
        
        <p style="color: #374151; font-size: 16px;">
          Пожалуйста, свяжитесь с учеником для обсуждения деталей обучения.
        </p>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.NEXTAUTH_URL}/my-students" 
             style="background-color: #364954; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
            Перейти в кабинет тренера
          </a>
        </div>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; color: #6b7280; font-size: 12px;">
        <p style="margin: 0;">Это письмо было отправлено автоматически. Пожалуйста, не отвечайте на него.</p>
      </div>
    </div>
  `;
  
  const text = `
    Новая заявка на обучение
    
    Здравствуйте, ${teacherName}!
    
    Ученик ${studentName} хочет записаться к вам на занятия.
    
    Контакты ученика:
    Email: ${studentEmail}
    
    Пожалуйста, свяжитесь с учеником для обсуждения деталей обучения.
    Кабинет тренера: ${process.env.NEXTAUTH_URL}/my-students
  `;
  
  try {
    await transporter.sendMail({
      from: `"Образовательная платформа" <${process.env.GMAIL_USER}>`,
      to: teacherEmail,
      subject: `Заявка от ученика: ${studentName}`,
      text,
      html,
    });
    console.log(`Application email sent to teacher: ${teacherEmail}`);
    return { success: true };
  } catch (error) {
    console.error("Teacher application email error:", error);
    throw error;
  }
}

export async function sendNewUserVerificationEmail(
  adminEmail: string,
  userName: string,
  userEmail: string,
  userRole: string,
  verificationLink: string
) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #1f2937; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h2 style="color: #ffffff; margin: 0;">Новая заявка на регистрацию</h2>
      </div>
      
      <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="color: #374151; font-size: 16px;">Здравствуйте, Администратор!</p>
        
        <p style="color: #374151; font-size: 16px;">
          Зарегистрирован новый пользователь, ожидающий проверки:
        </p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <table style="width: 100%; color: #4b5563; font-size: 15px; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 120px; border-bottom: 1px solid #e5e7eb;">Имя:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${userName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #e5e7eb;">Email:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${userEmail}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Роль:</td>
              <td style="padding: 8px 0;">${userRole}</td>
            </tr>
          </table>
        </div>
        
        <p style="color: #374151; font-size: 16px;">
          Пожалуйста, проверьте предоставленные документы и подтвердите регистрацию пользователя в панели администратора.
        </p>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${verificationLink}" 
             style="background-color: #1f2937; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
            Перейти к проверке
          </a>
        </div>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; color: #6b7280; font-size: 12px;">
        <p style="margin: 0;">Это письмо было отправлено автоматически. Пожалуйста, не отвечайте на него.</p>
      </div>
    </div>
  `;
  
  const text = `
    Новая заявка на регистрацию
    
    Здравствуйте, Администратор!
    
    Зарегистрирован новый пользователь, ожидающий проверки:
    
    Имя: ${userName}
    Email: ${userEmail}
    Роль: ${userRole}
    
    Пожалуйста, проверьте предоставленные документы и подтвердите регистрацию пользователя в панели администратора:
    ${verificationLink}
  `;
  
  try {
    await transporter.sendMail({
      from: `"Образовательная платформа" <${process.env.GMAIL_USER}>`,
      to: adminEmail,
      subject: `Новая заявка на регистрацию: ${userName} (${userRole})`,
      text,
      html,
    });
    console.log(`Verification email sent to admin: ${adminEmail}`);
    return { success: true };
  } catch (error) {
    console.error("Admin email sending error:", error);
    throw error;
  }
}

function formatDate(date?: Date): string {
  if (!date) return "не указано";
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(date));
}