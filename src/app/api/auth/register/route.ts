import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role } = await request.json();

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role === "TUTOR" ? "TUTOR" : "STUDENT",
      },
    });

    // Create role-specific profile
    if (role === "STUDENT") {
      await prisma.studentProfile.create({
        data: {
          userId: user.id,
          subjects: "", // Empty string for comma-separated subjects
          bio: "",
          grade: ""
        },
      });
    } else if (role === "TUTOR") {
      await prisma.tutorProfile.create({
        data: {
          userId: user.id,
          subjects: "", // Empty string for comma-separated subjects
          hourlyRate: 0,
          bio: "",
          education: "",
          experience: "",
          availability: JSON.stringify({}), // Empty JSON object as string
        },
      });
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      message: "User registered successfully",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
