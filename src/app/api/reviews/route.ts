import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/auth";

// Define BookingStatus enum to match Prisma schema
enum BookingStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED"
}



// GET /api/reviews - Get reviews (with filtering options)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract filter parameters
    const tutorId = searchParams.get("tutorId");
    const studentId = searchParams.get("studentId");
    const minRating = searchParams.get("minRating");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;
    
    // Build filter conditions
    const where: any = {};
    
    if (tutorId) {
      where.tutorId = tutorId;
    }
    
    if (studentId) {
      where.studentId = studentId;
    }
    
    if (minRating) {
      where.rating = {
        gte: parseInt(minRating),
      };
    }
    
    // Get reviews with pagination
    const reviews = await prisma.review.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        tutor: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        booking: {
          select: {
            id: true,
            subject: true,
            startTime: true,
            endTime: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });
    
    // Count total reviews for pagination
    const totalReviews = await prisma.review.count({ where });
    
    return NextResponse.json({
      reviews,
      pagination: {
        total: totalReviews,
        page,
        limit,
        totalPages: Math.ceil(totalReviews / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/reviews - Create a new review
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth("STUDENT");
    const studentId = session.user.id;
    const body = await request.json();
    
    const { bookingId, rating, comment } = body;
    
    // Validate required fields
    if (!bookingId || !rating) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Validate rating is between 1 and 5
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }
    
    // Get the booking
    const booking = await prisma.booking.findUnique({
      where: {
        id: bookingId,
      },
    });
    
    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }
    
    // Check if the student is the one who booked the session
    if (booking.studentId !== studentId) {
      return NextResponse.json(
        { error: "You can only review your own bookings" },
        { status: 403 }
      );
    }
    
    // Check if the booking is completed
    if (booking.status !== BookingStatus.COMPLETED) {
      return NextResponse.json(
        { error: "You can only review completed sessions" },
        { status: 400 }
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
        { error: "You have already reviewed this session" },
        { status: 409 }
      );
    }
    
    // Create the review
    const review = await prisma.review.create({
      data: {
        bookingId,
        studentId,
        tutorId: booking.tutorId,
        rating,
        comment,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        tutor: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });
    
    // Update tutor's average rating
    const tutorReviews = await prisma.review.findMany({
      where: {
        tutorId: booking.tutorId,
      },
      select: {
        rating: true,
      },
    });
    
    const totalRating = tutorReviews.reduce((sum: number, review: { rating: number }) => sum + review.rating, 0);
    const averageRating = totalRating / tutorReviews.length;
    
    await prisma.tutorProfile.update({
      where: {
        userId: booking.tutorId,
      },
      data: {
        averageRating,
      },
    });
    
    return NextResponse.json(review, { status: 201 });
  } catch (error: any) {
    console.error("Error creating review:", error);
    
    if (error.message === "Authentication required") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    if (error.message === "Unauthorized: Insufficient permissions") {
      return NextResponse.json(
        { error: "Only students can create reviews" },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
