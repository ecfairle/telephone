"use client"
import { useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { SessionProvider } from "next-auth/react";

export default function LoginPageWrapper() {
    return (
        <SessionProvider>
            <LoginPage></LoginPage>
        </SessionProvider>
    )
}

function LoginPage() {

    const { data: session } = useSession();
    useEffect(() => {
        if (session) {
            window.location.pathname = "/";
        }
    }, [session]);

    return (
        <div>
            <p>Login to access your account</p>

            <button onClick={() => signIn()}>
                Login with OAuth
            </button>
        </div>
    );
}