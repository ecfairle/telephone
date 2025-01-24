import {fetchAvailableDrawings, fetchGames, getRoom} from '@/lib/data';
import {GameDrawing} from "@/lib/data_definitions";
import ListGame from "@/app/game_list";
import {redirect} from "next/navigation";
import {getServerSession} from "next-auth";
import {authOptions} from "@/app/api/auth/[...nextauth]/auth";
import NewGame from "./new_game";
import ShareLink from "@/app/(game)/share_link";
import LeaveRoom from "@/app/(game)/leave_room";

export default async function Home() {
  // const params = await searchParams;
  const session = await getServerSession(authOptions);
  if (!session?.user?.userId) {
    return redirect('/login')
  }
  console.log('sdui----' + session?.user?.userId)
  const userId = session?.user?.userId;
  const {'room_id': roomId, 'users': roomies} = await getRoom(userId);
  const games = await fetchGames(userId, roomId);
  console.log('games: ' + games);
  const drawings = await fetchAvailableDrawings(Object.keys(games));
  const gameDrawings = drawings.reduce((prev: {[key: string]: GameDrawing[]}, cur) => {
    if (cur.game_id in prev) {
      return {...prev, [cur.game_id]: [...prev[cur.game_id], cur]};
    } else {
      return {...prev, [cur.game_id]: [cur]}
    }
  }, {});
  console.log(gameDrawings);
  console.log(roomies);
  console.log(roomId);
  return (<div className={"ml-5  container"}>
    {roomies.length > 1 && <LeaveRoom/>}
    {Object.keys(games).length === 0 ?
        <div className={"flex-row"}>
          {roomies.length > 1 && <NewGame roomId={roomId}/>}
          <div className={"flex flex-col"}>
            {roomies.map((user) => {
              return(
                  <div key={user.id} className='w-24 h-24 mt-10 truncate'>{user.name}
                    <img className={'w-12 h-12'} src={user.image} />
                  </div>)})
            }
    {Array.from({length: 5-roomies.length}, (v,k)=>k+1).map((idx) => (
        <div key={idx}><ShareLink roomId={roomId}></ShareLink>
    </div>
    ))}
        </div>
      </div>
    :
    <div className={'flex flex-col mt-10'}>
      {Object.entries(games).map((game, idx) => (
          <div key={idx}>
            <ListGame userId={userId} drawings={gameDrawings[game[0]]}/>
          </div>
      ))}
    </div>
    }
      </div>
    )
    }

