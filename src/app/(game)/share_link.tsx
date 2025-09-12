'use client'
import {Link} from "lucide-react";
import ButtonOverlay from "@/components/ButtonOverlay";

export default function ShareLink({roomId, showTooltip}: {roomId: string, showTooltip: boolean}) {
    return (
        <ButtonOverlay tooltipText={showTooltip? 'Invite friends to play' : undefined} overlayText={'Copied room link'}
                       className='w-24 mt-8'
                       onClick={() => {
                           navigator.clipboard.writeText(
                               new URL(`${process.env.NEXT_PUBLIC_SITE_URL}/join_room/${roomId}`).href
                           )
                       }}>
              <Link size={20}/> &nbsp;&nbsp; <p> {"Share "} </p>
        </ButtonOverlay>
    )
}