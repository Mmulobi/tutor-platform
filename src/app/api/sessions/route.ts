import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/auth";
import { Prisma } from "@prisma/client";
import type { Session } from "@/types/session";

type PrismaUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
};

type PrismaTutorProfile = {
  subjects: string;
  hourlyRate: number;
  averageRating: number | null;
};

type PrismaPayment = {
  id: string;
  amount: number;
  status: string;
  createdAt: Date;
};

type PrismaSession = {
  id: string;
  studentId: string;
  tutorId: string;
  subject: string;
  scheduledFor: Date;
  duration: number;
  status: string;
  meetingLink: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  student: PrismaUser;
  tutor: PrismaUser & {
    tutorProfile: PrismaTutorProfile | null;
  };
  payment: PrismaPayment | null;
};




type SessionQueryWhere = {
  studentId?: string;
  tutorId?: string;
  status?: string;
};



// GET /api/sessions - Get sessions for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const userRole = session.user.role;
    const { searchParams } = new URL(request.url);
    
    // Extract filter parameters
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;
    
    // Build query conditions
    const where: SessionQueryWhere = {};
    
    // Add role-specific conditions
    if (userRole === 'STUDENT') {
      where.studentId = userId;
    } else if (userRole === 'TUTOR') {
      where.tutorId = userId;
    }

    // Add status filter if provided
    if (status && ['SCHEDULED', 'COMPLETED', 'CANCELLED'].includes(status)) {
      where.status = status;
    }
    
    // Fetch sessions with optimized includes
    const [sessions, totalSessions] = await Promise.all([
      prisma.session.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              name: true,
              image: true,
              email: true,
            },
          },
          tutor: {
            select: {
              id: true,
              name: true,
              image: true,
              email: true,
            },
            include: {
              tutorProfile: {
                select: {
                  subjects: true,
                  hourlyRate: true,
                  averageRating: true,
                },
              },
            },
          },
          payment: {
            select: {
              id: true,
              amount: true,
              status: true,
            },
          },
        },
        orderBy: {
          scheduledFor: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.session.count({ where }),
    ]);
    
    // Transform and validate sessions
    const formattedSessions: Session[] = sessions.map((session: PrismaSession) => ({
      id: session.id,
      scheduledFor: session.scheduledFor.toISOString(),
      duration: session.duration,
      status: session.status,
      subject: session.subject,
      meetingLink: session.meetingLink,
      notes: session.notes,
      tutor: {
        id: session.tutor.id,
        name: session.tutor.name,
        email: session.tutor.email,
        image: session.tutor.image,
        tutorProfile: session.tutor.tutorProfile ? {
          subjects: session.tutor.tutorProfile.subjects,
          hourlyRate: session.tutor.tutorProfile.hourlyRate,
          averageRating: session.tutor.tutorProfile.averageRating,
        } : undefined,
      },
      student: {
        id: session.student.id,
        name: session.student.name,
        email: session.student.email,
        image: session.student.image,
      },
      payment: session.payment ? {
        id: session.payment.id,
        amount: session.payment.amount,
        status: session.payment.status,
        createdAt: session.payment.createdAt.toISOString(),
      } : null,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      sessions: formattedSessions,
      pagination: {
        total: totalSessions,
        page,
        limit,
        totalPages: Math.ceil(totalSessions / limit),
      },
    }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching sessions:", error);
    
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

// POST /api/sessions - Create a new session
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const userRole = session.user.role;
    const body = await request.json();
    
    const { tutorId, studentId, scheduledFor, duration, subject } = body;
    
    // Validate required fields
    if (!tutorId || !studentId || !scheduledFor || !duration || !subject) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Ensure the student is the current user if role is STUDENT
    if (userRole === "STUDENT" && studentId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }
    
    // Ensure the tutor is the current user if role is TUTOR
    if (userRole === "TUTOR" && tutorId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }
    
    // Validate tutor exists and is available
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
    
    // Check for scheduling conflicts
    const conflictingSession = await prisma.session.findFirst({
      where: {
        tutorId,
        status: "SCHEDULED",
        scheduledFor: {
          gte: new Date(scheduledFor),
          lt: new Date(new Date(scheduledFor).getTime() + duration * 60000),
        },
      },
    });
    
    if (conflictingSession) {
      return NextResponse.json(
        { error: "Tutor is not available at this time" },
        { status: 400 }
      );
    }
    
    // Create session
    const tutorSession = await prisma.session.create({
      data: {
        tutorId,
        studentId,
        scheduledFor: new Date(scheduledFor),
        duration,
        subject,
        status: "SCHEDULED",
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true,
          },
        },
        tutor: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true,
          },
          include: {
            tutorProfile: {
              select: {
                subjects: true,
                hourlyRate: true,
                averageRating: true,
              },
            },
          },
        },
        payment: {
          select: {
            id: true,
            amount: true,
            status: true,
          },
        },
      },
    });
    
    // Emit real-time session booking event
    const io = (global as any).io;
    if (io) {
      // Notify both tutor and student
      io.to(tutorId).emit('session-booked', tutorSession);
      io.to(studentId).emit('session-booked', tutorSession);
    }
    
    return NextResponse.json(tutorSession, { status: 201 });
  } catch (error: any) {
    console.error("Error creating session:", error);
    
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
