"use client";
import {GameDrawing} from "@/lib/data_definitions";
import {useRouter} from "next/navigation";
import { Button } from '@/components/button'
import { SendHorizonal } from 'lucide-react'
import {useEffect, useState} from "react";


export default function Guess({gameDrawing, imageUrl} : {gameDrawing: GameDrawing, imageUrl: string}) {
    const router = useRouter();
    const calculateExpiringMinLeft = (drawingUpdatedAt:Date) => {
        const timeDiff = new Date(Date.now()).getTime() - drawingUpdatedAt.getTime();
        return 30 - Math.floor(timeDiff / 1000 / 60) % 60;
    }
    const [expiryMinLeft, setExpiryMinLeft] = useState(calculateExpiringMinLeft(gameDrawing.updated_at));
    useEffect(() => {
        const intervalId = setInterval(() => {
            setExpiryMinLeft(calculateExpiringMinLeft(gameDrawing.updated_at));
        }, 3000);
        return () => clearInterval(intervalId);
    }, [gameDrawing])

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const form = e.target;
        const formData = new FormData(form as HTMLFormElement);
        await fetch(`/save_guess/${gameDrawing.id}`, {
            method: 'POST',
                headers: {
                'Accept': 'application/json', 'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                game_drawing_id: gameDrawing.id,
                guess: formData.get("guess")
            })

        })
        if (gameDrawing.room_id !== null) {
            router.push(`/room/${gameDrawing.room_id}`);
        } else {
            router.push(`/shuffle`);
        }

    }

    return (
            <div className='container mx-auto max-w-fit box-sizing'>
                <form method="post" onSubmit={handleSubmit} className='text-3xl justify-center text-center'>
                    <label>Guess: <input className={'rounded-xl border-black border w-80 pl-2'} name="guess" autoComplete="off"/></label>
                    <Button
                        size='xl'
                        type='submit'
                        className={'m-5 bg-blue-500 text-white'}>
                        <SendHorizonal size={25}/>
                    </Button>
                    {gameDrawing.room_id === null && <div className='text-center justify-center'>{`${expiryMinLeft > 0 ? expiryMinLeft : `<1`}min left`}</div>}
                </form>
                <img alt='drawing' src={`${imageUrl}`} className='border border-black'/>
            </div>
        )
}