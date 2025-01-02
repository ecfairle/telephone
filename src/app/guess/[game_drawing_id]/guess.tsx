"use client";
import {GameDrawing} from "@/lib/data_definitions";
import {useRouter} from "next/navigation";
import { Button } from '@/components/button'
import { SendHorizonal } from 'lucide-react'


export default function Guess({gameDrawing, imageUrl} : {gameDrawing: GameDrawing, imageUrl: string}) {
    const router = useRouter();
    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const form = e.target;
        const formData = new FormData(form as HTMLFormElement);
        fetch(`/save_guess/${gameDrawing.id}`, {
            method: 'POST',
                headers: {
                'Accept': 'application/json', 'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                game_drawing_id: gameDrawing.id,
                guess: formData.get("guess")
            })

        })
        router.push("/");
    }

    return (
            <div className='container mx-auto max-w-fit'>
                <form method="post" onSubmit={handleSubmit} className='text-3xl justify-center text-center'>
                    <label>Guess: <input name="guess" autoComplete="off"/></label>
                    <Button
                        size='lg'
                        type='submit'
                        color={''}>
                        <SendHorizonal/>
                    </Button>
                </form>
                <img alt='drawing' src={`${imageUrl}`} className='border border-black'/>
            </div>
        )
}