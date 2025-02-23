'use client'
import {Plus} from "lucide-react";
import ButtonOverlay from "@/components/ButtonOverlay";

export default function ShareLink({roomId, showTooltip}: {roomId: string, showTooltip: boolean}) {
    return (
        <ButtonOverlay tooltipText={showTooltip? 'Invite friends to play' : undefined} overlayText={'Copied room link'}
                       className='w-12 h-12 mt-8'
                       variant={'blue'}
                       onClick={() => {
                           navigator.clipboard.writeText(
                               new URL(`${process.env.NEXT_PUBLIC_SITE_URL}/join_room/${roomId}`).href
                           )
                       }}>
            <Plus size={35}/>
        </ButtonOverlay>
    )
}