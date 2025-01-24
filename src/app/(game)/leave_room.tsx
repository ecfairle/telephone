'use client'
import {Button} from "@/components/button";
import {leaveRoom} from "@/lib/api";
import {useRouter} from "next/navigation";
import React from "react";
import {useSession} from "next-auth/react";

export default function LeaveRoom() {
    const router = useRouter();
    const session = useSession();
    return (
        <Button onClick={async () => {
            await leaveRoom(session?.data?.user.userId as string);
            router.refresh();

        }}>Leave Room</Button>
    )
}