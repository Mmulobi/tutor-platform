import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcrypt";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function getCurrentUser() {
  try {
    const session = await getSession();
    
    if (!session?.user?.email) {
      return null;
    }
    
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        studentProfile: true,
        tutorProfile: true,
      },
    });
    
    if (!currentUser) {
      return null;
    }
    
    return {
      ...currentUser,
      createdAt: currentUser.createdAt.toISOString(),
      updatedAt: currentUser.updatedAt.toISOString(),
      emailVerified: currentUser.emailVerified?.toISOString() || null,
    };
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

export async function registerUser(
  email: string,
  password: string,
  name: string,
  role: UserRole
) {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      throw new Error("User with this email already exists");
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role,
      },
    });
    
    // Create role-specific profile
    if (role === "STUDENT") {
      await prisma.studentProfile.create({
        data: {
          userId: user.id,
        },
      });
    } else if (role === "TUTOR") {
      await prisma.tutorProfile.create({
        data: {
          userId: user.id,
        },
      });
    }
    
    return user;
  } catch (error) {
    console.error("Error registering user:", error);
    throw error;
  }
}

export async function isAuthenticated() {
  const session = await getSession();
  return !!session;
}

export async function hasRole(role: UserRole) {
  const session = await getSession();
  return session?.user?.role === role;
}

export async function requireAuth(role?: UserRole) {
  const session = await getSession();
  
  if (!session) {
    throw new Error("Authentication required");
  }
  
  if (role && session.user.role !== role) {
    throw new Error("Unauthorized: Insufficient permissions");
  }
  
  return session;
}
