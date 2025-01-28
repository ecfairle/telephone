import {createPool} from "@vercel/postgres";
import {NextAuthOptions} from "next-auth";
import PostgresAdapter from "@auth/pg-adapter";
import DiscordProvider from "next-auth/providers/discord";
import GoogleProvider from "next-auth/providers/google";

const pool = createPool();
export const authOptions: NextAuthOptions = {
    secret: process.env.NEXT_AUTH_SECRET as string,
    adapter: PostgresAdapter(pool),
    providers: [
        DiscordProvider({
            clientId: process.env.DISCORD_ID as string,
            clientSecret: process.env.DISCORD_SECRET as string
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_ID as string,
            clientSecret: process.env.GOOGLE_SECRET as string,
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code"
                }
            }
        })
    ],
    callbacks: {
        session: async ({ session, token }) => {
            if (session?.user) {
                session.user.userId = token.userId;
            }
            return session;
        },
        jwt: async ({ user, token }) => {
            if (user) {
                token.userId = user.id;
            }
            return token;
        },
    },
    session: {
        strategy: 'jwt',
    },
}