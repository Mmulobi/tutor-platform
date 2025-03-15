import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/auth";



// GET /api/tutors - Get all tutors with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract filter parameters
    const subject = searchParams.get("subject");
    const minRating = searchParams.get("minRating");
    const maxRate = searchParams.get("maxRate");
    const minRate = searchParams.get("minRate");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;
    
    // Build filter conditions
    const where: any = {
      role: "TUTOR",
      tutorProfile: {
        isNot: null,
      },
    };
    
    // Add subject filter if provided
    if (subject) {
      where.tutorProfile = {
        ...where.tutorProfile,
        subjects: {
          has: subject,
        },
      };
    }
    
    // Add rating filter if provided
    if (minRating) {
      where.tutorProfile = {
        ...where.tutorProfile,
        averageRating: {
          gte: parseFloat(minRating),
        },
      };
    }
    
    // Add rate filters if provided
    if (minRate || maxRate) {
      where.tutorProfile = {
        ...where.tutorProfile,
        hourlyRate: {
          ...(minRate && { gte: parseFloat(minRate) }),
          ...(maxRate && { lte: parseFloat(maxRate) }),
        },
      };
    }
    
    // Get tutors with pagination
    const tutors = await prisma.user.findMany({
      where,
      include: {
        tutorProfile: true,
      },
      skip,
      take: limit,
    });
    
    // Count total tutors for pagination
    const totalTutors = await prisma.user.count({ where });
    
    // Clean up sensitive information
    const sanitizedTutors = tutors.map((tutor: any) => ({
      id: tutor.id,
      name: tutor.name,
      image: tutor.image,
      profile: {
        bio: tutor.tutorProfile?.bio,
        education: tutor.tutorProfile?.education,
        experience: tutor.tutorProfile?.experience,
        hourlyRate: tutor.tutorProfile?.hourlyRate,
        subjects: tutor.tutorProfile?.subjects,
        averageRating: tutor.tutorProfile?.averageRating,
      },
    }));
    
    return NextResponse.json({
      tutors: sanitizedTutors,
      pagination: {
        total: totalTutors,
        page,
        limit,
        totalPages: Math.ceil(totalTutors / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching tutors:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
