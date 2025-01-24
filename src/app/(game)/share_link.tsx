'use client'
import {Plus} from "lucide-react";
import ButtonOverlay from "@/components/ButtonOverlay";

export default function ShareLink({roomId}: {roomId: string}) {
    return (
        <ButtonOverlay overlayText={'Copied Room Link'} className='w-24 h-24 mt-10'
                       onClick={() => {
                           navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_SITE_URL}/join_room/${roomId}`)
                       }}>
            <Plus/>
        </ButtonOverlay>
    )
}