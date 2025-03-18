import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireAuth } from "@/lib/auth/auth";

// GET /api/profile - Get current user's profile
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        tutorProfile: session.user.role === "TUTOR",
        studentProfile: session.user.role === "STUDENT",
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error("Error fetching profile:", error);

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

// PUT /api/profile - Update current user's profile
export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const body = await request.json();

    const { name, tutorProfile, studentProfile } = body;

    // Update user's name
    const updateData: any = {
      name,
    };

    // Update role-specific profile
    if (session.user.role === "TUTOR" && tutorProfile) {
      updateData.tutorProfile = {
        upsert: {
          create: {
            bio: tutorProfile.bio,
            education: tutorProfile.education,
            experience: tutorProfile.experience,
            hourlyRate: tutorProfile.hourlyRate,
            subjects: tutorProfile.subjects,
            availability: tutorProfile.availability,
          },
          update: {
            bio: tutorProfile.bio,
            education: tutorProfile.education,
            experience: tutorProfile.experience,
            hourlyRate: tutorProfile.hourlyRate,
            subjects: tutorProfile.subjects,
            availability: tutorProfile.availability,
          },
        },
      };
    } else if (session.user.role === "STUDENT" && studentProfile) {
      updateData.studentProfile = {
        upsert: {
          create: {
            bio: studentProfile.bio,
            interests: studentProfile.interests,
            gradeLevel: studentProfile.gradeLevel,
          },
          update: {
            bio: studentProfile.bio,
            interests: studentProfile.interests,
            gradeLevel: studentProfile.gradeLevel,
          },
        },
      };
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        tutorProfile: session.user.role === "TUTOR",
        studentProfile: session.user.role === "STUDENT",
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error("Error updating profile:", error);

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
