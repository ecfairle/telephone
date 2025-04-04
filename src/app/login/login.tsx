'use client'
import {signIn, useSession} from "next-auth/react";
import {useEffect} from "react";
import {useSearchParams} from "next/navigation";
import {Button} from "@/components/button"
import GameBlurb from "@/app/(game)/game_blurb";

export default function LoginPage() {

    const { data: session } = useSession();
    useEffect(() => {
        if (session) {
            window.location.pathname = "/";
        }
    }, [session]);

    const searchParams = useSearchParams();
    let callbackUrl = searchParams.has('room_id')? `/join_room/${searchParams.get('room_id')}`: '/';
    if (searchParams.has('shuffle')) {
        callbackUrl = '/shuffle';
    }
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
            <GameBlurb/>
            </div>
        </div>
    );
}