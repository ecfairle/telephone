'use client'
import {Button} from "@/components/button";
import {Plus} from "lucide-react";

export default function ShareLink({roomId}: {roomId: string}) {
    return (
        <Button className='w-24 h-24 mt-10' onClick={() => {navigator.clipboard.writeText(`localhost:3000/join_room/${roomId}`)}}><Plus></Plus></Button>
    )
}