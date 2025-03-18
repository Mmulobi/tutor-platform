import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";



// GET /api/tutors/:id - Get a specific tutor's details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tutorId = params.id;
    
    const tutor = await prisma.user.findUnique({
      where: {
        id: tutorId,
        role: "TUTOR",
      },
      include: {
        tutorProfile: true,
        tutorReviews: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          take: 5,
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
    
    if (!tutor) {
      return NextResponse.json(
        { error: "Tutor not found" },
        { status: 404 }
      );
    }
    
    // Clean up sensitive information
    const sanitizedTutor = {
      tutor: {
        id: tutor.id,
        name: tutor.name,
        image: tutor.image,
        profile: {
          bio: tutor.tutorProfile?.bio,
          education: tutor.tutorProfile?.education,
          experience: tutor.tutorProfile?.experience,
          hourlyRate: tutor.tutorProfile?.hourlyRate,
          subjects: tutor.tutorProfile?.subjects?.split(',').map((subject: string) => subject.trim()) || [],
          availability: tutor.tutorProfile?.availability,
          averageRating: tutor.tutorProfile?.averageRating,
        },
        reviews: tutor.tutorReviews.map((review) => ({
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
          student: {
            id: review.student.id,
            name: review.student.name,
            image: review.student.image,
          },
        })),
      },
    };
    
    return NextResponse.json(sanitizedTutor);
  } catch (error) {
    console.error("Error fetching tutor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
