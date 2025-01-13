import {fetchAvailableDrawings, fetchGames} from '@/lib/data';
import {GameDrawing} from "@/lib/data_definitions";
import ListGame from "@/app/game_list";
import {redirect} from "next/navigation";
import {getServerSession} from "next-auth";
import {authOptions} from "@/app/api/auth/[...nextauth]/auth";
import NewGame from "./new_game";

export default async function Home() {
  // const params = await searchParams;
  const session = await getServerSession(authOptions);
  if (!session?.user?.userId) {
    return redirect('/login')
  }
  console.log('sdui----' + session?.user?.userId)
  const userId = session?.user?.userId;
  const games = await fetchGames(userId);
  const drawings = await fetchAvailableDrawings(userId);
  const gameDrawings = drawings.reduce((prev: {[key: string]: GameDrawing[]}, cur) => {
    if (cur.game_id in prev) {
      return {...prev, [cur.game_id]: [...prev[cur.game_id], cur]};
    } else {
      return {...prev, [cur.game_id]: [cur]}
    }
  }, {});
  console.log(gameDrawings);

  console.log(games);
  return (<div className={"container"}>
    <NewGame userId={userId}/>
    {Object.entries(games).map((game, idx) => (
        <div key={idx}>
          <li key={idx}>
            {"Game with " + game[1].map((e: {name: string}) => e.name).join(', ')}
            <ListGame userId={userId} drawings={gameDrawings[game[0]]} gameId={game[0]}/>
          </li>
          </div>
    ))}
      </div>)
}

