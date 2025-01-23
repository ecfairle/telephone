import '@/app/globals.css'
import Header from './header'
import {getServerSession} from "next-auth";
import {authOptions} from "@/app/api/auth/[...nextauth]/auth";
import SessionProvider from "@/providers/SessionProvider";
import React from "react";
import {redirect} from "next/navigation";

export default async function Layout({ children } : {children: React.ReactNode}) {
    const data = await getServerSession(authOptions);
    if (!data) {
        return redirect("/login");
    }
  return (
      <div>
      <SessionProvider session={data}><Header/>
      <main>{children}</main>
      </SessionProvider>
      </div>
  )
}