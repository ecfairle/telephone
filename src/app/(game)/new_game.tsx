'use client'
import {Button} from "@/components/button";
import {startNewGame} from "@/lib/api";
import {useRouter} from "next/navigation";

export default function NewGame({roomId}: {roomId: string}) {
    const router = useRouter();
    return (
        <Button onClick={async () => {
            await startNewGame(roomId);
            router.refresh();

        }}>New Game</Button>
    )
}