import { auth } from "@/auth";
import Unauthorized from "./unauthorized";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const isDevView = process.env.NEXT_PUBLIC_ADMIN_DEV_VIEW === "true";
    const session = await auth();
    const isAdmin = isDevView || session?.user?.role === "ADMIN";

    if (!isAdmin) {
        return <Unauthorized />;
    }

    return <>{children}</>;
}
