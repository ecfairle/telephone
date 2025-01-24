'use client'
import {Plus} from "lucide-react";
import ButtonOverlay from "@/components/ButtonOverlay";

export default function ShareLink({roomId}: {roomId: string}) {
    return (
        <ButtonOverlay overlayText={'Copied Room Link'} className='w-24 h-24 mt-10' onClick={() => {navigator.clipboard.writeText(`localhost:3000/join_room/${roomId}`)}}><Plus></Plus></ButtonOverlay>
    )
}