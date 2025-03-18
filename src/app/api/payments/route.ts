'use server';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/auth";

// POST /api/payments - Create a new payment record
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const userRole = session.user.role;
    const body = await request.json();
    
    const { sessionId, amount, tutorId, studentId } = body;
    
    // Validate required fields
    if (!sessionId || !amount || !tutorId || !studentId) {
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
    
    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        sessionId,
        amount,
        tutorId,
        studentId,
        status: "PENDING", // Initial status
      },
      include: {
        session: true,
        tutor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    // Emit real-time payment event
    const io = (global as any).io;
    if (io) {
      // Notify both tutor and student
      io.to(tutorId).emit('payment-created', payment);
      io.to(studentId).emit('payment-created', payment);
    }
    
    return NextResponse.json(payment, { status: 201 });
  } catch (error: any) {
    console.error("Error creating payment:", error);
    
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

// GET /api/payments - Get payments for the current user
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
    
    const where = {
      ...(status && { status }),
      ...(userRole === "STUDENT" ? { studentId: userId } : { tutorId: userId }),
    };
    
    const [payments, totalPayments] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          session: true,
          tutor: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          student: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);
    
    return NextResponse.json({
      payments,
      pagination: {
        total: totalPayments,
        page,
        limit,
        totalPages: Math.ceil(totalPayments / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching payments:", error);
    
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
