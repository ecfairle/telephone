import {fetchAvailableDrawings, fetchGames} from '@/lib/data';
import Link from 'next/link';
import {getSignedUrl} from "@/lib/gcs";
import {GameDrawing} from "@/lib/data_definitions";

export default async function Home() {
  // const params = await searchParams;
  const userId = '0fd40421-dc18-46ca-b19a-68f853e8ddc4';
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
    {Object.entries(games).map((game, idx) => (
        <div key={idx}>
          <li key={idx}>
            {"Game with " + game[1].map((e: {name: string}) => e.name).join(', ')}
          </li>
          <ListGame userId={userId} drawings={gameDrawings[game[0]]}/></div>
    ))}
      </div>)
}

async function ListGame ({drawings, userId} : {drawings: GameDrawing[], userId: string}) {
  let alreadyFinished = false;
  let myTurn = false;
  let isDrawing = false;
  let isGuessing = false;
  let someoneElse = null;
  let someoneElseGuessing = false;
  console.log(drawings, userId)
  const turns = [];
  for (const drawing of drawings) {
    if (drawing.guesser_id !== null && drawing.target_word !== null) {
      turns.push({
        ...drawing,
        isDraw: false,
        isMe: drawing.guesser_id === userId,
        userId: drawing.guesser_id
      })
    }
    if (drawing.drawer_id !== null && drawing.drawing_done) {
      turns.push({
        ...drawing,
        isDraw: true,
        isMe: drawing.drawer_id === userId,
        userId: drawing.drawer_id
      })
    }
  }
  for (const drawing of drawings) {
    if (drawing.guesser_id === userId) {
      isGuessing = true;
      if (drawing.target_word === null) {
        myTurn = true;
        break;
      }
      else {
        alreadyFinished = true;
        break;
      }
    }
    if (drawing.drawer_id === userId) {
      isDrawing = true;
      if (drawing.drawing_done) {
        alreadyFinished = true;
        break;
      }
      else {
        myTurn = true;
        break;
      }
    }
  }
  if (!isDrawing && !isGuessing) {
    for (const drawing of drawings) {
      if (!drawing.drawing_done && drawing.target_word !== null) {
        if (drawing.drawer_id === null) {
          isDrawing = true;
        } else {
          someoneElse = drawing.drawer_name;
        }
        break;
      }
      if (drawing.target_word === null) {
        if (drawing.guesser_id === null) {
          isGuessing = true;
        }
        else {
          someoneElse = drawing.guesser_name;
          someoneElseGuessing = true;
        }
        break;
      }
    }
  }
  console.log(alreadyFinished, isDrawing, isGuessing, myTurn)
  return (<div>
    {alreadyFinished ?
            <div className={"flex w-1/2"}>
              {
                turns.map(async (turn, idx) => {
                  return turn.isDraw? (
                      <div className={"flex-1"} key={idx}>{`${turn.isMe ? "You" : turn.drawer_name} drew `}<img className={''} alt='past drawing'
                                                                                          src={`${await getSignedUrl(turn.id)}`}/>
                      </div>) : (<div className={"flex-1"}  key={idx}>{`${turn.isMe ? "You" : turn.guesser_name} guessed "${turn.target_word}"`}</div>)
                })}
            </div> :
            isDrawing ?
              myTurn ?
                <Link
                    href={{
                      pathname: `/canvas/${drawings.at(-1)?.id}`}}
                > {"FINISH DRAWING"}</Link> :
                  <Link
                      href={{
                        pathname: `/canvas/${drawings.at(-1)?.id}`}}
                  > {"DRAW a drawing"}</Link> :
              isGuessing ?
                  myTurn ?
                      <Link href={{pathname: `/guess/${drawings.at(-1)?.id}`}}><p>{`FINISH GUESSING`}</p></Link> :
                      <Link href={{pathname: `/guess/${drawings.at(-1)?.id}`}}><p>{`TRY GUESSING`}</p></Link> :
                  someoneElse ? `${someoneElse} is ${someoneElseGuessing? 'guessing' : 'drawing'}`: 'invalid state.'

      }
      </div>
    )
}