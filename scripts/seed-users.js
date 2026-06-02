/* eslint-disable @typescript-eslint/no-require-imports */
const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function seedUsers() {
  // Create admin user
  const adminExists = await prisma.user.findUnique({ where: { email: 'admin@school.edu' } })
  if (!adminExists) {
    const hash = await bcrypt.hash('admin123', 12)
    await prisma.user.create({
      data: { name: 'Admin User', email: 'admin@school.edu', password: hash, role: 'admin', isActive: true }
    })
    console.log('Created admin user')
  } else {
    console.log('Admin user already exists')
  }

  // Create staff user
  const staffExists = await prisma.user.findUnique({ where: { email: 'staff@school.edu' } })
  if (!staffExists) {
    const hash = await bcrypt.hash('staff123', 12)
    await prisma.user.create({
      data: { name: 'Staff Member', email: 'staff@school.edu', password: hash, role: 'staff', isActive: true }
    })
    console.log('Created staff user')
  } else {
    console.log('Staff user already exists')
  }

  // Create teacher user
  const teacherExists = await prisma.user.findUnique({ where: { email: 'sarah.j@school.edu' } })
  if (!teacherExists) {
    const hash = await bcrypt.hash('teacher123', 12)
    await prisma.user.create({
      data: { name: 'Sarah Johnson', email: 'sarah.j@school.edu', password: hash, role: 'teacher', isActive: true }
    })
    console.log('Created teacher user')
  } else {
    console.log('Teacher user already exists')
  }

  await prisma.$disconnect()
  console.log('Done!')
}

seedUsers().catch(e => { console.error(e); process.exit(1) })
