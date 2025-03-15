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



// GET /api/bookings/:id - Get a specific booking
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const bookingId = params.id;
    
    // Get booking with related data
    const booking = await prisma.booking.findUnique({
      where: {
        id: bookingId,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        tutor: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        payment: true,
        review: true,
      },
    });
    
    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }
    
    // Check if user is authorized to view this booking
    if (
      session.user.role !== "ADMIN" &&
      booking.studentId !== userId &&
      booking.tutorId !== userId
    ) {
      return NextResponse.json(
        { error: "Unauthorized to view this booking" },
        { status: 403 }
      );
    }
    
    return NextResponse.json(booking);
  } catch (error: any) {
    console.error("Error fetching booking:", error);
    
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

// PATCH /api/bookings/:id - Update a booking status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const bookingId = params.id;
    const body = await request.json();
    
    const { status, meetingLink } = body;
    
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
    
    // Check authorization based on the requested action
    if (status === BookingStatus.CONFIRMED) {
      // Only tutors can confirm bookings
      if (session.user.role !== "TUTOR" || booking.tutorId !== userId) {
        return NextResponse.json(
          { error: "Only the assigned tutor can confirm bookings" },
          { status: 403 }
        );
      }
    } else if (status === BookingStatus.CANCELLED) {
      // Both students and tutors can cancel their own bookings
      if (
        session.user.role !== "ADMIN" &&
        booking.studentId !== userId &&
        booking.tutorId !== userId
      ) {
        return NextResponse.json(
          { error: "Unauthorized to cancel this booking" },
          { status: 403 }
        );
      }
    } else if (status === BookingStatus.COMPLETED) {
      // Only tutors can mark bookings as completed
      if (session.user.role !== "TUTOR" || booking.tutorId !== userId) {
        return NextResponse.json(
          { error: "Only the assigned tutor can complete bookings" },
          { status: 403 }
        );
      }
    }
    
    // Update the booking
    const updatedBooking = await prisma.booking.update({
      where: {
        id: bookingId,
      },
      data: {
        status: status as BookingStatus,
        ...(meetingLink && { meetingLink }),
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tutor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    // If booking is completed, create earning record for tutor
    if (status === BookingStatus.COMPLETED) {
      await prisma.earning.create({
        data: {
          tutorId: booking.tutorId,
          amount: booking.price,
          description: `Earning from session with ${updatedBooking.student.name} on ${new Date(booking.startTime).toLocaleDateString()}`,
        },
      });
      
      // Update payment status to completed
      await prisma.payment.update({
        where: {
          bookingId: booking.id,
        },
        data: {
          status: "COMPLETED",
        },
      });
    }
    
    // If booking is cancelled, update payment status
    if (status === BookingStatus.CANCELLED) {
      await prisma.payment.update({
        where: {
          bookingId: booking.id,
        },
        data: {
          status: "REFUNDED",
        },
      });
    }
    
    return NextResponse.json(updatedBooking);
  } catch (error: any) {
    console.error("Error updating booking:", error);
    
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

// DELETE /api/bookings/:id - Delete a booking (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth("ADMIN");
    const bookingId = params.id;
    
    // Check if booking exists
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
    
    // Delete booking and related records
    await prisma.$transaction([
      prisma.payment.deleteMany({
        where: {
          bookingId,
        },
      }),
      prisma.review.deleteMany({
        where: {
          bookingId,
        },
      }),
      prisma.booking.delete({
        where: {
          id: bookingId,
        },
      }),
    ]);
    
    return NextResponse.json(
      { message: "Booking deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting booking:", error);
    
    if (error.message === "Authentication required") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    if (error.message === "Unauthorized: Insufficient permissions") {
      return NextResponse.json(
        { error: "Only admins can delete bookings" },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
