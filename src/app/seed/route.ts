import { db } from '@vercel/postgres';
const users = [
    {
        id: '410544b2-4001-4271-9855-fec4b6a6442a',
        name: 'Eugene',
        email: 'user@nextmail.com',
    },
    {
        id: '41051234-4001-4271-9855-fec4b6a6442b',
        name: 'Lucas',
        email: 'user2@nextmail.com',
        password: '123456',
    },
    {
        id: '9845a2a1-a862-448f-99db-a56881ecadc3',
        name: 'Josh',
        email: 'user3@nextmail.com',
        password: '123456',
    },
    {
        id: '0fd40421-dc18-46ca-b19a-68f853e8ddc4',
        name: 'Kent',
        email: 'user4@nextmail.com',
        password: '123456',
    },
    {
        id: '9f040ed8-f0d4-4520-a0c2-537d539b54c7',
        name: 'Aaron',
        email: 'user5@nextmail.com',
        password: '123456',
    },
    {
        id: 'ed57a015-9893-4818-ac2d-8629c581617d',
        name: 'Andrew',
        email: 'user6@nextmail.com',
        password: '123456',
    },
];

const games = [
    {
        id: 'f9eda13b-e0da-4407-9c0e-37e51b76672f',
        original_word: 'cloud',
    },
    {
        id: 'fa02b93b-1580-4ee0-9212-9f6221ffa252',
        original_word: 'cat'
    }
];

const game_users = [
    {
        user_id: '410544b2-4001-4271-9855-fec4b6a6442a',
        game_id: 'f9eda13b-e0da-4407-9c0e-37e51b76672f',
    },
    {
        user_id: '41051234-4001-4271-9855-fec4b6a6442b',
        game_id: 'f9eda13b-e0da-4407-9c0e-37e51b76672f',
    },
    {
        user_id: '9845a2a1-a862-448f-99db-a56881ecadc3',
        game_id: 'f9eda13b-e0da-4407-9c0e-37e51b76672f',
    },
    {
        user_id: '0fd40421-dc18-46ca-b19a-68f853e8ddc4',
        game_id: 'f9eda13b-e0da-4407-9c0e-37e51b76672f',
    },
    // game 2
    {
        user_id: '410544b2-4001-4271-9855-fec4b6a6442a',
        game_id: 'fa02b93b-1580-4ee0-9212-9f6221ffa252',
    },
    {
        user_id: '41051234-4001-4271-9855-fec4b6a6442b',
        game_id: 'fa02b93b-1580-4ee0-9212-9f6221ffa252',
    },
    {
        user_id: '9845a2a1-a862-448f-99db-a56881ecadc3',
        game_id: 'fa02b93b-1580-4ee0-9212-9f6221ffa252',
    },
];

const game_drawings = [
    {
        id: '2257f0df-4cd4-4ce7-a5ef-39a1b990b8fe',
        game_id: 'f9eda13b-e0da-4407-9c0e-37e51b76672f',
        drawer_id: null,
        guesser_id: null,
        target_word: 'cloud',
        next_id: null,
        drawing_done: false,
        is_first: true,
        prev_game_drawing_id: null,
    },
    {
        id: '3da0443e-54c6-4036-a945-e8e4be03b38f',
        game_id: 'fa02b93b-1580-4ee0-9212-9f6221ffa252',
        drawer_id: null,
        guesser_id: null,
        target_word: 'cat',
        next_id: null,
        drawing_done: false,
        is_first: true,
        prev_game_drawing_id: null,
    },
    // {
    //     id: '7dc14ffd-dace-424f-ad04-4cda3574b9c2',
    //     game_id: 'f9eda13b-e0da-4407-9c0e-37e51b76672f',
    //     drawer_id: null,
    //     guesser_id: null,
    //     target_word: null,
    //     next_id: null,
    //     drawing_done: false,
    //     is_first: false,
    //     prev_game_drawing_id: '2257f0df-4cd4-4ce7-a5ef-39a1b990b8fe'
    // }
];
const client = await db.connect();

async function seedUsers() {
  await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

  await client.sql`
  CREATE TABLE verification_token
(
  identifier TEXT NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  token TEXT NOT NULL,
 
  PRIMARY KEY (identifier, token)
);
 
CREATE TABLE accounts
(
  id SERIAL,
  "userId" UUID NOT NULL,
  type VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  "providerAccountId" VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  id_token TEXT,
  scope TEXT,
  session_state TEXT,
  token_type TEXT,
 
  PRIMARY KEY (id)
);
 
CREATE TABLE sessions
(
  id SERIAL,
  "userId" UUID NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  "sessionToken" VARCHAR(255) NOT NULL,
 
  PRIMARY KEY (id)
);
 
CREATE TABLE users
(
  id UUID DEFAULT uuid_generate_v4() NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  "emailVerified" TIMESTAMPTZ,
  image TEXT,
 
  PRIMARY KEY (id)
);`

  const insertedUsers = await Promise.all(
    users.map(async (user) => {
      return client.sql`
        INSERT INTO users (id, name, email)
        VALUES (${user.id}, ${user.name}, ${user.email})
        ON CONFLICT (id) DO NOTHING;
      `;
    }),
  );

  return insertedUsers;
}

async function seedGames() {
    await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
    await client.sql`
    CREATE TABLE IF NOT EXISTS games (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      original_word TEXT NOT NULL
    );
  `;

    const insertedGames = await Promise.all(
        games.map(async (game) => {
            return client.sql`
        INSERT INTO games (id, original_word)
        VALUES (${game.id}, ${game.original_word})
        ON CONFLICT (id) DO NOTHING;
      `;
        }),
    );

    await client.sql`
    CREATE TABLE IF NOT EXISTS game_users (
      game_id UUID NOT NULL REFERENCES games,
      user_id UUID NOT NULL REFERENCES users,
      UNIQUE (game_id, user_id)
    );
  `;

    await Promise.all(
        game_users.map(async (game_user) => {
            return client.sql`
        INSERT INTO game_users (game_id, user_id)
        VALUES (${game_user.game_id}, ${game_user.user_id});
      `;
        }),
    );

    await client.sql`
    CREATE TABLE IF NOT EXISTS game_drawings (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      game_id UUID NOT NULL REFERENCES games,
      drawing_done boolean NOT NULL,
      drawer_id UUID REFERENCES users,
      guesser_id UUID REFERENCES users,
      target_word TEXT,
      image BYTEA,
      prev_game_drawing_id UUID REFERENCES game_drawings
    );
  `;

    await Promise.all(
        game_drawings.map(async (game_drawing) => {
            return client.sql`
        INSERT INTO game_drawings (id, game_id, drawer_id, guesser_id, target_word, drawing_done, prev_game_drawing_id)
        VALUES (${game_drawing.id}, ${game_drawing.game_id}, ${game_drawing.drawer_id}, ${game_drawing.guesser_id}, ${game_drawing.target_word}, ${game_drawing.drawing_done}, ${game_drawing.prev_game_drawing_id})
        ON CONFLICT (id) DO NOTHING;
      `;
        }),
    );

    return insertedGames;
}

export async function GET() {
    try {
      await client.sql`BEGIN`;
      await client.sql`DROP table accounts; DROP table sessions; DROP table verification_token; `
      await client.sql`DROP TABLE game_users; DROP TABLE game_drawings; DROP TABLE games; DROP TABLE users; `;
      await seedUsers();
      await seedGames();
      await client.sql`COMMIT`;

      return Response.json({ message: 'Database seeded successfully' });
    } catch (error) {
      await client.sql`ROLLBACK`;
      return Response.json({ error }, { status: 500 });
    }
}