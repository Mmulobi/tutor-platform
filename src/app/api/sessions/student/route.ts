import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth/config';
import { BookingStatus, UserRole } from '@prisma/client';

import { Booking, Payment, Review, User } from '@prisma/client';

type TutorWithProfile = User & {
  tutorProfile: {
    subjects: string[];
    hourlyRate: number;
    averageRating: number | null;
  } | null;
};

type SessionWithRelations = Booking & {
  tutor: TutorWithProfile;
  payment: Payment | null;
  review: Review | null;
};

type SessionResponse = {
  upcoming: SessionWithRelations[];
  completed: SessionWithRelations[];
  pending: SessionWithRelations[];
  cancelled: SessionWithRelations[];
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get all bookings for the student
    const bookings = await prisma.booking.findMany({
      where: {
        studentId: userId,
      },
      include: {
        tutor: {
          select: {
            id: true,
            name: true,
            image: true,
            tutorProfile: {
              select: {
                subjects: true,
                hourlyRate: true,
                averageRating: true,
              },
            },
          },
        },
        payment: true,
        review: true,
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    // Group sessions by status
    const now = new Date();
    const groupedSessions: SessionResponse = {
      upcoming: bookings.filter(booking => 
        booking.status === BookingStatus.CONFIRMED && new Date(booking.startTime) > now
      ),
      completed: bookings.filter(booking => 
        booking.status === BookingStatus.COMPLETED
      ),
      pending: bookings.filter(booking => 
        booking.status === BookingStatus.PENDING
      ),
      cancelled: bookings.filter(booking => 
        booking.status === BookingStatus.CANCELLED
      ),
    };

    // Sort upcoming sessions by start time
    groupedSessions.upcoming.sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    // Sort completed sessions by end time, most recent first
    groupedSessions.completed.sort((a, b) => 
      new Date(b.endTime).getTime() - new Date(a.endTime).getTime()
    );

    return NextResponse.json(groupedSessions);
  } catch (error) {
    console.error('Error fetching student sessions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Add a review to a completed session
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { bookingId, rating, comment } = body;

    if (!bookingId || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Invalid request body. Rating must be between 1 and 5.' },
        { status: 400 }
      );
    }

    // Verify the booking exists and belongs to the student
    const booking = await prisma.booking.findUnique({
      where: {
        id: bookingId,
        studentId: session.user.id,
        status: 'COMPLETED',
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found or not eligible for review' },
        { status: 404 }
      );
    }

    // Check if a review already exists
    const existingReview = await prisma.review.findUnique({
      where: {
        bookingId,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'Review already exists for this session' },
        { status: 400 }
      );
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        bookingId,
        rating,
        comment,
        studentId: session.user.id,
        tutorId: booking.tutorId,
      },
    });

    // Update tutor's average rating
    const tutorReviews = await prisma.review.findMany({
      where: {
        tutorId: booking.tutorId,
      },
    });

    const averageRating = tutorReviews.reduce((sum, review) => sum + review.rating, 0) / tutorReviews.length;

    await prisma.tutorProfile.update({
      where: {
        userId: booking.tutorId,
      },
      data: {
        averageRating,
      },
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
