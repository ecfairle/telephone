import NextAuth, {NextAuthOptions} from "next-auth"
import DiscordProvider from "next-auth/providers/discord"
import PostgresAdapter from "@auth/pg-adapter"
import { createPool } from "@vercel/postgres"

const pool = createPool();
export const authOptions: NextAuthOptions = {
    secret: process.env.NEXT_AUTH_SECRET as string,
    adapter: PostgresAdapter(pool),
    providers: [
        DiscordProvider({
            clientId: process.env.DISCORD_ID as string,
            clientSecret: process.env.DISCORD_SECRET as string
        })
    ],
    callbacks: {
        session: async ({ session, token }) => {
            if (session?.user) {
                session.user.id = token.uid;
            }
            return session;
        },
        jwt: async ({ user, token }) => {
            if (user) {
                token.uid = user.id;
            }
            return token;
        },
    },
    session: {
        strategy: 'jwt',
    },
}
const handler = NextAuth(authOptions);

export {handler as GET, handler as POST}