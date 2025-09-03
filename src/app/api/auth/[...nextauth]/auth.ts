import {createPool} from "@vercel/postgres";
import {NextAuthOptions} from "next-auth";
import PostgresAdapter from "@auth/pg-adapter";
import DiscordProvider from "next-auth/providers/discord";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

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
        }),
        CredentialsProvider({
            id: 'anonymous',
            name: 'Anonymous',
            credentials: {},
            authorize: async () => {
                const pg = PostgresAdapter(pool);
                if (!pg?.createUser) {
                    throw new Error('Postgres Adapter not configured correctly');
                }
                const user = pg.createUser({ 
                    id: 'anonymous',
                    name: 'anonymous',
                    email: 'guest@example.com',
                    emailVerified: null,
                    image: null
                })

                return user
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