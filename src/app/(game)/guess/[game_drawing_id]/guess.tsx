"use client";
import {GameDrawing} from "@/lib/data_definitions";
import {useRouter} from "next/navigation";
import { Button } from '@/components/button'
import { SendHorizonal } from 'lucide-react'


export default function Guess({gameDrawing, imageUrl} : {gameDrawing: GameDrawing, imageUrl: string}) {
    const router = useRouter();
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
        router.push("/");
    }

    return (
            <div className='container mx-auto max-w-fit pr-5 pl-2'>
                <form method="post" onSubmit={handleSubmit} className='text-3xl justify-center text-center'>
                    <label>Guess: <input className={'rounded-xl p-2 border-black border w-80'} name="guess" autoComplete="off"/></label>
                    <Button
                        size='xl'
                        type='submit'
                        className={'m-5 bg-blue-500 text-white'}>
                        <SendHorizonal size={25}/>
                    </Button>
                </form>
                <img alt='drawing' src={`${imageUrl}`} className='border border-black'/>
            </div>
        )
}