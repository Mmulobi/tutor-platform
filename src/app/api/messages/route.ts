import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/auth";



// GET /api/messages - Get messages for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    
    // Extract filter parameters
    const otherUserId = searchParams.get("userId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;
    
    // If otherUserId is provided, get conversation with that user
    if (otherUserId) {
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            {
              senderId: userId,
              receiverId: otherUserId,
            },
            {
              senderId: otherUserId,
              receiverId: userId,
            },
          ],
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          receiver: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      });
      
      // Mark unread messages as read
      await prisma.message.updateMany({
        where: {
          senderId: otherUserId,
          receiverId: userId,
          read: false,
        },
        data: {
          read: true,
        },
      });
      
      // Count total messages for pagination
      const totalMessages = await prisma.message.count({
        where: {
          OR: [
            {
              senderId: userId,
              receiverId: otherUserId,
            },
            {
              senderId: otherUserId,
              receiverId: userId,
            },
          ],
        },
      });
      
      return NextResponse.json({
        messages,
        pagination: {
          total: totalMessages,
          page,
          limit,
          totalPages: Math.ceil(totalMessages / limit),
        },
      });
    } else {
      // Get conversations (grouped by other user)
      const conversations = await prisma.$queryRaw`
        SELECT 
          CASE 
            WHEN m."senderId" = ${userId} THEN m."receiverId" 
            ELSE m."senderId" 
          END as "otherUserId",
          MAX(m."createdAt") as "lastMessageAt",
          COUNT(CASE WHEN m."read" = false AND m."receiverId" = ${userId} THEN 1 END) as "unreadCount"
        FROM "Message" m
        WHERE m."senderId" = ${userId} OR m."receiverId" = ${userId}
        GROUP BY "otherUserId"
        ORDER BY "lastMessageAt" DESC
        LIMIT ${limit} OFFSET ${skip}
      `;
      
      // Get user details for each conversation
      const conversationsWithUsers = await Promise.all(
        (conversations as any[]).map(async (conv) => {
          const otherUser = await prisma.user.findUnique({
            where: {
              id: conv.otherUserId,
            },
            select: {
              id: true,
              name: true,
              image: true,
              role: true,
            },
          });
          
          // Get the last message
          const lastMessage = await prisma.message.findFirst({
            where: {
              OR: [
                {
                  senderId: userId,
                  receiverId: conv.otherUserId,
                },
                {
                  senderId: conv.otherUserId,
                  receiverId: userId,
                },
              ],
            },
            orderBy: {
              createdAt: "desc",
            },
          });
          
          return {
            otherUser,
            lastMessage,
            unreadCount: Number(conv.unreadCount),
            lastMessageAt: conv.lastMessageAt,
          };
        })
      );
      
      return NextResponse.json({
        conversations: conversationsWithUsers,
      });
    }
  } catch (error: any) {
    console.error("Error fetching messages:", error);
    
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

// POST /api/messages - Send a new message
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const senderId = session.user.id;
    const body = await request.json();
    
    const { receiverId, content } = body;
    
    // Validate required fields
    if (!receiverId || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Validate receiver exists
    const receiver = await prisma.user.findUnique({
      where: {
        id: receiverId,
      },
    });
    
    if (!receiver) {
      return NextResponse.json(
        { error: "Receiver not found" },
        { status: 404 }
      );
    }
    
    // Create message
    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
          },
        },
      },
    });

    // Emit real-time message event through WebSocket
    const io = (global as any).io;
    if (io) {
      io.to(receiverId).emit('receive-message', {
        ...message,
        createdAt: message.createdAt.toISOString(),
      });
    }
    
    return NextResponse.json(message, { status: 201 });
  } catch (error: any) {
    console.error("Error sending message:", error);
    
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
