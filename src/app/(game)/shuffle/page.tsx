import {redirect} from "next/navigation";
import {getServerSession} from "next-auth";
import {authOptions} from "@/app/api/auth/[...nextauth]/auth";
import React from "react";
import Shuffle from './shuffle'

export default async function Home() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.userId) {
        return redirect('/login')
    }
    const userId = session.user.userId;
    return <Shuffle userId={userId} />
}