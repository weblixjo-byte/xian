import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "xian Loyalty Pass",
  description: "xian Restaurante Oriental Digital Loyalty Pass & Rewards",
  applicationName: "xian Pass",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "xian Pass",
  },
  manifest: "/manifest.json",
};

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
