import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail } from "@/lib/email/send";

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists with this email" },
        { status: 400 }
      );
    }

    // 2. Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 3. Create the user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || email.split("@")[0], // Fallback name
      },
    });

    // 4. Send welcome email (non-blocking)
    console.log("[Register] User created, sending welcome email to", email);
    sendWelcomeEmail({
      to: email,
      name: name || email.split("@")[0],
    }).then((res) => {
      console.log("[Register] Welcome email result:", JSON.stringify(res));
    }).catch((err) => {
      console.error("[Register] Welcome email failed:", err.message);
    });

    return NextResponse.json(
      { message: "User registered successfully", userId: user.id, emailSent: true },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error during registration" },
      { status: 500 }
    );
  }
}
