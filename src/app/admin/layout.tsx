import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "xian Admin Dashboard",
  description: "xian Restaurante Oriental Executive Admin Dashboard",
  applicationName: "xian Admin",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "xian Admin",
  },
  manifest: "/manifest-admin.json",
  other: {
    "application-name": "xian Admin Dashboard",
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
