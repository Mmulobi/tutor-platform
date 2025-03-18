import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth/config';
import { User, Booking, Review } from '@prisma/client';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { tutorProfile: true }
    });

    if (!user || user.role !== 'TUTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all students who have bookings with this tutor
    const students = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        bookings: {
          some: {
            tutorId: user.id
          }
        }
      },
      include: {
        studentProfile: true,
        bookings: {
          where: {
            tutorId: user.id
          },
          orderBy: {
            startTime: 'desc'
          },
          take: 1, // Get only the most recent booking
          include: {
            review: true
          }
        },
        reviews: {
          where: {
            tutorId: user.id
          }
        }
      }
    });

    // Calculate additional metrics for each student
    const enrichedStudents = students.map((student: User & {
      studentProfile: any;
      bookings: (Booking & { review: Review | null })[];
      reviews: Review[];
    }) => {
      const totalSessions = student.bookings.length;
      const completedSessions = student.bookings.filter(
        (booking: Booking) => booking.status === 'COMPLETED'
      ).length;
      const averageRating = student.reviews.length > 0
        ? student.reviews.reduce((sum: number, review: Review) => sum + review.rating, 0) / student.reviews.length
        : null;
      const lastSession = student.bookings[0]?.startTime || null;

      return {
        id: student.id,
        name: student.name,
        email: student.email,
        image: student.image,
        profile: student.studentProfile,
        metrics: {
          totalSessions,
          completedSessions,
          averageRating,
          lastSession
        }
      };
    });

    return NextResponse.json(enrichedStudents);
  } catch (error) {
    console.error('Error fetching tutor\'s students:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
