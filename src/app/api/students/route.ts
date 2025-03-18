import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/auth";

// GET /api/students - Get students for the current tutor
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const userRole = session.user.role;

    // Only tutors can access student information
    if (userRole !== "TUTOR") {
      return NextResponse.json(
        { error: "Only tutors can access student information" },
        { status: 403 }
      );
    }

    // Get all bookings for this tutor with student information
    const tutorBookings = await prisma.booking.findMany({
      where: {
        tutorId: userId,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    // Group bookings by student and create student objects with booking history
    const studentMap = new Map();
    
    tutorBookings.forEach((booking) => {
      const student = booking.student;
      if (!studentMap.has(student.id)) {
        studentMap.set(student.id, {
          ...student,
          bookings: [],
        });
      }
      
      studentMap.get(student.id).bookings.push({
        id: booking.id,
        subject: booking.subject,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
      });
    });

    const uniqueStudents = Array.from(studentMap.values());

    return NextResponse.json({
      students: uniqueStudents,
    });
  } catch (error: any) {
    console.error("Error fetching students:", error);

    if (error.message === "Authentication required") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
