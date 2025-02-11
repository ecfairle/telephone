'use client'
import {signIn, useSession} from "next-auth/react";
import {useEffect} from "react";
import {useSearchParams} from "next/navigation";
import {Button} from "@/components/button"

export default function LoginPage() {

    const { data: session } = useSession();
    useEffect(() => {
        if (session) {
            window.location.pathname = "/";
        }
    }, [session]);

    const searchParams = useSearchParams();
    const callbackUrl = searchParams.has('room_id')? `/join_room/${searchParams.get('room_id')}`: '/';
    console.log('CALLBACK', callbackUrl)
    return (
        <div className={'m-5 flex text-center justify-center '}>
            <div className={'max-w-80 '}>
            <p className={'m-5'}>Log in to play</p>
            <div className={'flex flex-col items-center position-relative'}>
            <Button type='button'
                    variant='outline' className={'w-64 h-12'} onClick={() => signIn('discord', {callbackUrl: callbackUrl})}>
                Login with Discord
            </Button>
            <br/>
            <Button type='button'
                    variant='outline' className={'w-64 h-12'} onClick={() => signIn('google', {callbackUrl: callbackUrl})}>
                Login with Google
            </Button>
            </div>
            <div className={'border border-black text-center justify-center mt-5 p-2'}>
                <h2>How to play:</h2>
                <br/>
                Join a room with 1-4 friends to play. Every day there are a new set of words. When you start the game,
                a word will be randomly assigned to each player. <br/>For each word, the first player will draw that word. Then, the next
                player in order will guess the
                first player&apos;s drawing, and the next player will draw the second player&apos;s guess. And so on. At the end,
                see how the original word morphed being passed between everyone!
            </div>
            </div>
        </div>
    );
}