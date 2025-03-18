import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }
    
    // Redirect based on role
    let redirectUrl = '/dashboard';
    if (user.role === 'TUTOR') {
      redirectUrl = '/dashboard/tutor';
    } else if (user.role === 'STUDENT') {
      redirectUrl = '/dashboard/student';
    }
    
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  } catch (error) {
    console.error('Error in role redirect:', error);
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }
}
