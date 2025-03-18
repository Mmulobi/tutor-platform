import { NextRequest, NextResponse } from "next/server";
import { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireAuth } from "@/lib/auth/auth";



// GET /api/bookings - Get bookings for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    
    // Extract filter parameters
    const status = searchParams.get("status") as BookingStatus | null;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;
    
    // Build filter conditions based on user role
    const where: any = {};
    
    if (session.user.role === "STUDENT") {
      where.studentId = userId;
    } else if (session.user.role === "TUTOR") {
      where.tutorId = userId;
    } else {
      // Admin can see all bookings
    }
    
    // Add status filter if provided
    if (status) {
      where.status = status;
    }
    
    // Get bookings with pagination
    const bookings = await prisma.booking.findMany({
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
        payment: true,
      },
      orderBy: {
        startTime: "desc",
      },
      skip,
      take: limit,
    });
    
    // Count total bookings for pagination
    const totalBookings = await prisma.booking.count({ where });
    
    return NextResponse.json({
      bookings,
      pagination: {
        total: totalBookings,
        page,
        limit,
        totalPages: Math.ceil(totalBookings / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching bookings:", error);
    
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

// POST /api/bookings - Create a new booking
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth("STUDENT");
    const studentId = session.user.id;
    const body = await request.json();
    
    const {
      tutorId,
      subject,
      startTime,
      endTime,
      isGroupSession = false,
      notes,
    } = body;
    
    // Validate required fields
    if (!tutorId || !subject || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Validate tutor exists
    const tutor = await prisma.user.findUnique({
      where: {
        id: tutorId,
        role: "TUTOR",
      },
      include: {
        tutorProfile: true,
      },
    });
    
    if (!tutor || !tutor.tutorProfile) {
      return NextResponse.json(
        { error: "Tutor not found" },
        { status: 404 }
      );
    }
    
    // Calculate price based on tutor's hourly rate
    const startDateTime = new Date(startTime);
    const endDateTime = new Date(endTime);
    const durationHours = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60);
    
    // Apply hourly rate from tutor's profile
    const hourlyRate = tutor.tutorProfile.hourlyRate;
    const price = parseFloat(hourlyRate.toString()) * durationHours;
    
    // Create booking
    const booking = await prisma.booking.create({
      data: {
        studentId,
        tutorId,
        subject,
        startTime: startDateTime,
        endTime: endDateTime,
        isGroupSession,
        price,
        notes,
        status: BookingStatus.PENDING,
      },
    });
    
    // Create payment record
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: price,
        status: "PENDING",
      },
    });
    
    return NextResponse.json(booking, { status: 201 });
  } catch (error: any) {
    console.error("Error creating booking:", error);
    
    if (error.message === "Authentication required") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    if (error.message === "Unauthorized: Insufficient permissions") {
      return NextResponse.json(
        { error: "Only students can create bookings" },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
