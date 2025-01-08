import SessionProvider from "@/providers/SessionProvider"
import LoginPage from './login'
import {getServerSession} from "next-auth";
import {authOptions} from "@/app/api/auth/[...nextauth]/auth";

export default async function LoginPageWrapper() {
    const data = await getServerSession(authOptions);
    return (
        <SessionProvider session={data}>
            <LoginPage></LoginPage>
        </SessionProvider>
    )
}

