import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TaskFlow — Modern Task Management",
  description: "A powerful task management platform with real-time collaboration, smart assignments, and email notifications. Built for teams that ship.",
  keywords: ["task management", "project management", "team collaboration", "productivity"],
  authors: [{ name: "TaskFlow" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
