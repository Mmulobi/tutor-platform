import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth/config';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { tutorProfile: true }
    });

    if (!user || user.role !== 'TUTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookings = await prisma.booking.findMany({
      where: {
        tutorId: user.id,
        status: {
          in: ['PENDING', 'CONFIRMED']
        }
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            studentProfile: true
          }
        },
        payment: true,
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error fetching tutor bookings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
