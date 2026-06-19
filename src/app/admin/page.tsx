import type { Metadata } from "next";
import AdminPage from "@/components/pages/AdminPage";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "VangaTypePanalam administration panel for managing users, books, badges, and events.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <AdminPage />;
}
