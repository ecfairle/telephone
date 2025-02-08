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
        <div className={'m-5 flex flex-col max-w-64'}>
            <p className={'m-5'}>Login to access your account</p>

            <Button onClick={() => signIn('discord', {callbackUrl: callbackUrl})}>
                Login with Discord
            </Button>
            <br/>
            <Button onClick={() => signIn('google', {callbackUrl: callbackUrl})}>
                Login with Google
            </Button>
        </div>
    );
}