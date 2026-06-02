import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const force = req.nextUrl.searchParams.get('force')
    // Check if already seeded
    const studentCount = await db.student.count()
    const attendanceCount = await db.attendance.count()
    if (studentCount > 0 && attendanceCount > 0 && force !== 'true') {
      return NextResponse.json({ message: 'Database already seeded' })
    }

    // If force=true, delete all existing data
    if (force === 'true') {
      await db.grade.deleteMany()
      await db.staffAttendance.deleteMany()
      await db.attendance.deleteMany()
      await db.exam.deleteMany()
      await db.classSubject.deleteMany()
      await db.feePayment.deleteMany()
      await db.feeStructure.deleteMany()
      await db.message.deleteMany()
      await db.announcement.deleteMany()
      await db.student.deleteMany()
      await db.staff.deleteMany()
      await db.teacher.deleteMany()
      await db.subject.deleteMany()
      await db.class.deleteMany()
      await db.user.deleteMany()
    }

    // Seed default users for authentication
    const adminExists = await db.user.findUnique({ where: { email: 'admin@school.edu' } })
    if (!adminExists) {
      const hashedAdminPassword = await bcrypt.hash('admin123', 10)
      await db.user.create({
        data: {
          name: 'Admin User',
          email: 'admin@school.edu',
          password: hashedAdminPassword,
          role: 'admin',
          isActive: true,
        },
      })
    }

    const staffExists = await db.user.findUnique({ where: { email: 'staff@school.edu' } })
    if (!staffExists) {
      const hashedStaffPassword = await bcrypt.hash('staff123', 10)
      await db.user.create({
        data: {
          name: 'Staff Member',
          email: 'staff@school.edu',
          password: hashedStaffPassword,
          role: 'staff',
          isActive: true,
        },
      })
    }

    const teacherUserExists = await db.user.findUnique({ where: { email: 'sarah.j@school.edu' } })
    if (!teacherUserExists) {
      const hashedTeacherPassword = await bcrypt.hash('teacher123', 10)
      await db.user.create({
        data: {
          name: 'Sarah Johnson',
          email: 'sarah.j@school.edu',
          password: hashedTeacherPassword,
          role: 'teacher',
          isActive: true,
        },
      })
    }

    // If students exist but no attendance, just add attendance and extra fee data
    if (studentCount > 0 && attendanceCount === 0) {
      const students = await db.student.findMany()
      const teachers = await db.teacher.findMany()
      const staffMembers = await db.staff.findMany()

      // Create Attendance Records for last 5 school days
      const today = new Date()
      for (let d = 0; d < 5; d++) {
        const date = new Date(today)
        date.setDate(date.getDate() - d)
        if (date.getDay() === 0 || date.getDay() === 6) continue
        const dateStr = date.toISOString().split('T')[0]
        for (const s of students) {
          if (!s.classId) continue
          const rand = Math.random()
          const status = rand > 0.12 ? 'Present' : rand > 0.05 ? 'Late' : 'Absent'
          await db.attendance.create({
            data: { studentId: s.id, classId: s.classId, date: dateStr, status, remarks: '' },
          })
        }
        for (const t of teachers) {
          const rand = Math.random()
          const status = rand > 0.08 ? 'Present' : rand > 0.03 ? 'Late' : 'Absent'
          await db.staffAttendance.create({ data: { teacherId: t.id, date: dateStr, status, remarks: '' } })
        }
        for (const st of staffMembers) {
          const rand = Math.random()
          const status = rand > 0.05 ? 'Present' : 'On Leave'
          await db.staffAttendance.create({ data: { staffId: st.id, date: dateStr, status, remarks: '' } })
        }
      }

      // Add more fee payments with varied dates for chart data
      const months = ['2024-09', '2024-10', '2024-11', '2024-12', '2025-01', '2025-02']
      for (let m = 0; m < months.length; m++) {
        for (let i = 0; i < Math.min(5, students.length); i++) {
          const isPaid = Math.random() > 0.2
          await db.feePayment.create({
            data: {
              studentId: students[i].id,
              feeType: m % 2 === 0 ? 'Tuition' : 'Lab Fee',
              amount: m % 2 === 0 ? 5000 : 500,
              paymentDate: `${months[m]}-${String(10 + i).padStart(2, '0')}`,
              paymentMethod: ['Cash', 'Bank Transfer', 'Online'][i % 3],
              status: isPaid ? 'Paid' : Math.random() > 0.5 ? 'Pending' : 'Overdue',
              receiptNumber: `REC-${2000 + m * 10 + i}`,
              academicYear: '2024-2025',
            },
          })
        }
      }

      return NextResponse.json({ message: 'Attendance and fee data added successfully' })
    }

    // Create Classes
    const class1 = await db.class.create({ data: { name: 'Grade 9', grade: '9', section: 'A', academicYear: '2024-2025' } })
    const class2 = await db.class.create({ data: { name: 'Grade 10', grade: '10', section: 'A', academicYear: '2024-2025' } })
    const class3 = await db.class.create({ data: { name: 'Grade 11', grade: '11', section: 'B', academicYear: '2024-2025' } })
    const class4 = await db.class.create({ data: { name: 'Grade 12', grade: '12', section: 'A', academicYear: '2024-2025' } })

    // Create Teachers
    const t1 = await db.teacher.create({ data: { firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.j@school.edu', phone: '555-0101', qualification: 'M.Ed', specialization: 'Mathematics', hireDate: '2019-08-15', status: 'Active', gender: 'Female' } })
    const t2 = await db.teacher.create({ data: { firstName: 'Michael', lastName: 'Chen', email: 'michael.c@school.edu', phone: '555-0102', qualification: 'Ph.D', specialization: 'Physics', hireDate: '2020-01-10', status: 'Active', gender: 'Male' } })
    const t3 = await db.teacher.create({ data: { firstName: 'Emily', lastName: 'Davis', email: 'emily.d@school.edu', phone: '555-0103', qualification: 'M.A', specialization: 'English', hireDate: '2018-07-20', status: 'Active', gender: 'Female' } })
    const t4 = await db.teacher.create({ data: { firstName: 'Robert', lastName: 'Wilson', email: 'robert.w@school.edu', phone: '555-0104', qualification: 'M.Sc', specialization: 'Chemistry', hireDate: '2021-03-01', status: 'Active', gender: 'Male' } })

    // Assign class teachers
    await db.class.update({ where: { id: class1.id }, data: { classTeacherId: t1.id } })
    await db.class.update({ where: { id: class2.id }, data: { classTeacherId: t2.id } })
    await db.class.update({ where: { id: class3.id }, data: { classTeacherId: t3.id } })

    // Create Subjects
    const math = await db.subject.create({ data: { name: 'Mathematics', code: 'MATH101', description: 'Advanced Mathematics' } })
    const physics = await db.subject.create({ data: { name: 'Physics', code: 'PHY101', description: 'Introduction to Physics' } })
    const english = await db.subject.create({ data: { name: 'English', code: 'ENG101', description: 'English Literature & Grammar' } })
    const chem = await db.subject.create({ data: { name: 'Chemistry', code: 'CHEM101', description: 'Organic & Inorganic Chemistry' } })

    // Create Class-Subject assignments
    await db.classSubject.create({ data: { classId: class1.id, subjectId: math.id, teacherId: t1.id } })
    await db.classSubject.create({ data: { classId: class1.id, subjectId: physics.id, teacherId: t2.id } })
    await db.classSubject.create({ data: { classId: class2.id, subjectId: english.id, teacherId: t3.id } })
    await db.classSubject.create({ data: { classId: class2.id, subjectId: chem.id, teacherId: t4.id } })
    await db.classSubject.create({ data: { classId: class3.id, subjectId: math.id, teacherId: t1.id } })
    await db.classSubject.create({ data: { classId: class4.id, subjectId: physics.id, teacherId: t2.id } })

    // Create Students
    const studentData = [
      { firstName: 'James', lastName: 'Anderson', gender: 'Male', classId: class1.id },
      { firstName: 'Sophia', lastName: 'Martinez', gender: 'Female', classId: class1.id },
      { firstName: 'Liam', lastName: 'Brown', gender: 'Male', classId: class1.id },
      { firstName: 'Olivia', lastName: 'Taylor', gender: 'Female', classId: class2.id },
      { firstName: 'Noah', lastName: 'Garcia', gender: 'Male', classId: class2.id },
      { firstName: 'Emma', lastName: 'Wilson', gender: 'Female', classId: class2.id },
      { firstName: 'Lucas', lastName: 'Lee', gender: 'Male', classId: class3.id },
      { firstName: 'Ava', lastName: 'Clark', gender: 'Female', classId: class3.id },
      { firstName: 'Ethan', lastName: 'Hall', gender: 'Male', classId: class4.id },
      { firstName: 'Mia', lastName: 'Young', gender: 'Female', classId: class4.id },
      { firstName: 'Alexander', lastName: 'King', gender: 'Male', classId: class1.id },
      { firstName: 'Charlotte', lastName: 'Wright', gender: 'Female', classId: class3.id },
      { firstName: 'Benjamin', lastName: 'Scott', gender: 'Male', classId: class4.id },
      { firstName: 'Amelia', lastName: 'Adams', gender: 'Female', classId: class2.id },
      { firstName: 'Daniel', lastName: 'Baker', gender: 'Male', classId: class3.id },
    ]

    const createdStudents = []
    for (const s of studentData) {
      const student = await db.student.create({
        data: {
          ...s,
          dateOfBirth: '2008-05-15',
          phone: `555-${2000 + createdStudents.length}`,
          email: `${s.firstName.toLowerCase()}.${s.lastName.toLowerCase()}@student.edu`,
          guardianName: `Mr. ${s.lastName}`,
          guardianPhone: `555-${3000 + createdStudents.length}`,
          enrollmentDate: '2024-08-01',
          status: 'Active',
          address: `${100 + createdStudents.length} School Lane`,
        },
      })
      createdStudents.push(student)
    }

    // Create Staff
    await db.staff.create({ data: { firstName: 'Patricia', lastName: 'Moore', email: 'patricia.m@school.edu', role: 'Admin', department: 'Administration', hireDate: '2017-06-01', status: 'Active' } })
    await db.staff.create({ data: { firstName: 'David', lastName: 'Taylor', email: 'david.t@school.edu', role: 'Accountant', department: 'Finance', hireDate: '2019-03-15', status: 'Active' } })
    await db.staff.create({ data: { firstName: 'Jennifer', lastName: 'Thomas', email: 'jennifer.t@school.edu', role: 'Librarian', department: 'Library', hireDate: '2020-09-01', status: 'Active' } })

    // Create Fee Structures
    for (const cls of [class1, class2, class3, class4]) {
      await db.feeStructure.create({ data: { classId: cls.id, feeType: 'Tuition', amount: 5000, academicYear: '2024-2025' } })
      await db.feeStructure.create({ data: { classId: cls.id, feeType: 'Lab Fee', amount: 500, academicYear: '2024-2025' } })
    }

    // Create Fee Payments
    for (let i = 0; i < Math.min(10, createdStudents.length); i++) {
      await db.feePayment.create({
        data: {
          studentId: createdStudents[i].id,
          feeType: 'Tuition',
          amount: 5000,
          paymentDate: '2024-09-01',
          paymentMethod: ['Cash', 'Bank Transfer', 'Online'][i % 3],
          status: i < 7 ? 'Paid' : i < 9 ? 'Pending' : 'Overdue',
          receiptNumber: `REC-${1000 + i}`,
          academicYear: '2024-2025',
        },
      })
    }

    // Create Exams
    const exam1 = await db.exam.create({ data: { name: 'Mid-Term Exam', type: 'Mid-Term', classId: class1.id, subjectId: math.id, date: '2024-10-15', totalMarks: 100, description: 'First mid-term examination' } })
    const exam2 = await db.exam.create({ data: { name: 'Mid-Term Exam', type: 'Mid-Term', classId: class2.id, subjectId: english.id, date: '2024-10-16', totalMarks: 100, description: 'English mid-term' } })
    const exam3 = await db.exam.create({ data: { name: 'Unit Test 1', type: 'Unit Test', classId: class1.id, subjectId: physics.id, date: '2024-09-20', totalMarks: 50, description: 'Physics unit test' } })

    // Create Grades for exam1
    const class1Students = createdStudents.filter((s) => s.classId === class1.id)
    for (const s of class1Students) {
      const marks = 60 + Math.floor(Math.random() * 35)
      const pct = (marks / 100) * 100
      const grade = pct >= 90 ? 'A' : pct >= 80 ? 'B' : pct >= 70 ? 'C' : pct >= 60 ? 'D' : 'F'
      await db.grade.create({ data: { studentId: s.id, examId: exam1.id, marksObtained: marks, grade, remarks: '' } })
    }

    // Create Announcements
    await db.announcement.create({ data: { title: 'Welcome Back!', content: 'Welcome to the new academic year 2024-2025. We wish all students a successful year ahead.', targetAudience: 'All', priority: 'Normal', authorName: 'Principal', isActive: true } })
    await db.announcement.create({ data: { title: 'Annual Day Celebration', content: 'The Annual Day celebration will be held on November 15th. All parents are invited.', targetAudience: 'Parents', priority: 'High', authorName: 'School Admin', isActive: true } })
    await db.announcement.create({ data: { title: 'Mid-Term Exam Schedule', content: 'Mid-term exams will begin from October 15th. Students are advised to prepare well.', targetAudience: 'Students', priority: 'Urgent', authorName: 'Academic Coordinator', isActive: true } })

    // Create Messages
    await db.message.create({ data: { senderName: 'Sarah Johnson', senderRole: 'Teacher', receiverName: 'Mr. Anderson', receiverRole: 'Parent', subject: 'James Progress Report', content: 'Dear Mr. Anderson, I wanted to discuss James progress in Mathematics. He has been doing well in class and his recent test scores are encouraging.', isRead: false } })
    await db.message.create({ data: { senderName: 'Admin Office', senderRole: 'Admin', receiverName: 'All Teachers', receiverRole: 'Teacher', subject: 'Staff Meeting', content: 'There will be a staff meeting on Friday at 3 PM in the conference room to discuss the upcoming events.', isRead: true } })

    // Create Attendance Records for last 5 school days
    const today = new Date()
    for (let d = 0; d < 5; d++) {
      const date = new Date(today)
      date.setDate(date.getDate() - d)
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue
      const dateStr = date.toISOString().split('T')[0]
      for (const s of createdStudents) {
        const rand = Math.random()
        const status = rand > 0.12 ? 'Present' : rand > 0.05 ? 'Late' : 'Absent'
        await db.attendance.create({
          data: { studentId: s.id, classId: s.classId!, date: dateStr, status, remarks: '' },
        })
      }
    }

    // Create Staff Attendance for last 5 days
    const staffMembers = await db.staff.findMany()
    const allTeachers = [t1, t2, t3, t4]
    for (let d = 0; d < 5; d++) {
      const date = new Date(today)
      date.setDate(date.getDate() - d)
      if (date.getDay() === 0 || date.getDay() === 6) continue
      const dateStr = date.toISOString().split('T')[0]
      for (const t of allTeachers) {
        const rand = Math.random()
        const status = rand > 0.08 ? 'Present' : rand > 0.03 ? 'Late' : 'Absent'
        await db.staffAttendance.create({ data: { teacherId: t.id, date: dateStr, status, remarks: '' } })
      }
      for (const st of staffMembers) {
        const rand = Math.random()
        const status = rand > 0.05 ? 'Present' : 'On Leave'
        await db.staffAttendance.create({ data: { staffId: st.id, date: dateStr, status, remarks: '' } })
      }
    }

    // Add more fee payments with varied dates for chart data
    const months = ['2024-09', '2024-10', '2024-11', '2024-12', '2025-01', '2025-02']
    for (let m = 0; m < months.length; m++) {
      for (let i = 0; i < Math.min(5, createdStudents.length); i++) {
        const isPaid = Math.random() > 0.2
        await db.feePayment.create({
          data: {
            studentId: createdStudents[i + (m % 3) * 3 < createdStudents.length ? (i + (m % 3) * 3) : i].id,
            feeType: m % 2 === 0 ? 'Tuition' : 'Lab Fee',
            amount: m % 2 === 0 ? 5000 : 500,
            paymentDate: `${months[m]}-${String(10 + i).padStart(2, '0')}`,
            paymentMethod: ['Cash', 'Bank Transfer', 'Online'][i % 3],
            status: isPaid ? 'Paid' : Math.random() > 0.5 ? 'Pending' : 'Overdue',
            receiptNumber: `REC-${2000 + m * 10 + i}`,
            academicYear: '2024-2025',
          },
        })
      }
    }

    return NextResponse.json({ message: 'Database seeded successfully' })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 })
  }
}
