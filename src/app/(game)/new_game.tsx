'use client'
import {Button} from "@/components/button";
import {startNewGameFromUser} from "@/lib/api";

export default function NewGame({userId}: {userId: string}) {
    return (
        <Button onClick={async () => startNewGameFromUser(userId)}>New Game</Button>
    )
}