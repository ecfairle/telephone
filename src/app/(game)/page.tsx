import {getRooms} from '@/lib/data';
import {redirect} from "next/navigation";
import {getServerSession} from "next-auth";
import {authOptions} from "@/app/api/auth/[...nextauth]/auth";
import RoomSelector from "@/app/(game)/room_selector";
import React from "react";

export default async function Home() {
  // const params = await searchParams;
  const session = await getServerSession(authOptions);
  if (!session?.user?.userId) {
    return redirect('/login')
  }
  const userId = session.user.userId;

  const userRooms = await getRooms(userId);
  return (
      <div>
        <RoomSelector userRooms={userRooms}/>
      </div>
  )
}