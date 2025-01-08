import './globals.css'
import Header from './header'
import {getServerSession} from "next-auth";
import {authOptions} from "@/app/api/auth/[...nextauth]/auth";
import SessionProvider from "@/providers/SessionProvider";
import React from "react";

export default async function Layout({ children } : {children: React.ReactNode}) {
    const data = await getServerSession(authOptions);
  return (
      <html lang="en">
      <body>
      <SessionProvider session={data}><Header/></SessionProvider>
      <main>{children}</main>
      </body>
      </html>
  )
}