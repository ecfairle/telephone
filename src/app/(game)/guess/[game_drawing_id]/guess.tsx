"use client";
import {GameDrawing} from "@/lib/data_definitions";
import { Button } from '@/components/button'
import {Loader, SendHorizonal} from 'lucide-react'
import React, {useEffect, useState} from "react";
import { unreserveDrawing } from "@/lib/api";


export default function Guess({gameDrawing, imageUrl, roomId} : {gameDrawing: GameDrawing, imageUrl: string, roomId?: string}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string|null>(null);
    const calculateExpiringMinLeft = (drawingUpdatedAt:Date|string) => {
        const timeDiff = new Date(Date.now()).getTime() - new Date(drawingUpdatedAt).getTime();
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
        setLoading(true);
        const form = e.target;
        const formData = new FormData(form as HTMLFormElement);
        const guessField = (formData.get("guess") as string).toLowerCase().trim();
        if (guessField.length < 2) {
            setError('Guess too short');
            setLoading(false);
            return;
        }
        if (!guessField.match(/^[a-z\s]+$/)) {
            setError('Invalid characters');
            setLoading(false);
            return;
        }
        await fetch(`/save_guess/${gameDrawing.id}`, {
            method: 'POST',
                headers: {
                'Accept': 'application/json', 'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                game_drawing_id: gameDrawing.id,
                guess: guessField
            })

        })
    }

    return (
            <div className='container mx-auto max-w-fit box-sizing'>
                {!roomId && <div className='text-center justify-center'>{`${expiryMinLeft > 0 ? expiryMinLeft : `<1`} min left`}</div>}
                {error && <div className='text-red-500 text-center'>{error}</div>}
                <form method="post" onSubmit={handleSubmit} className='text-3xl justify-center text-center'>
                    <label>Guess: <input className={'rounded-xl border-black border w-80 pl-2'} name="guess" autoComplete="off" maxLength={17}/></label>
                    <Button
                        size='xl'
                        type='submit'
                        variant={'blue'}
                        className={'m-5'}
                        disabled={loading}>
                        {loading? <Loader className={'animate-spin'} size={25}/> :<SendHorizonal size={25}/>}
                    </Button>
                </form>
                {!loading && <div><Button size={"sm"} onClick={() => { unreserveDrawing(gameDrawing.game_id); }}>Skip</Button></div>}
                <img alt='drawing' src={`${imageUrl}`} className='border border-black'/>
            </div>
        )
}