import { handlers } from "@/auth" // Referring to src/auth.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const { GET, POST } = handlers
