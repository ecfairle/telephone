import {fetchAvailableDrawings, fetchGames} from '@/lib/data';
import Link from 'next/link';
import {getSignedUrl} from "@/lib/gcs";
import {GameDrawing} from "@/lib/data_definitions";

export default async function Home() {
  // const params = await searchParams;
  const userId = '410544b2-4001-4271-9855-fec4b6a6442a';
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
      // drawing available
      if (!drawing.drawing_done) {
        if (drawing.drawer_id === null) {
          isDrawing = true;
        } else {
          someoneElse = drawing.drawer_name;
        }
        break;
      }
      // first turn, ignore if target_word
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
  const pastDrawings = drawings.filter(drawing => drawing.drawer_id === userId && drawing.drawing_done);
  const curDrawings = drawings.filter(drawing =>
      (drawing.drawer_id === null || drawing.drawer_id === userId) &&
      drawing.drawing_done === false && drawing.target_word !== null);
  const curGuessable = drawings.filter(drawing => drawing.target_word === null);
  console.log(alreadyFinished, isDrawing, isGuessing, myTurn)
  return (<div>
      <p> {alreadyFinished ? "You already played a round." :
          isDrawing ?
              myTurn ?
                <Link
                    href={{
                      pathname: `/canvas/${curDrawings[0].id}`}}
                > {"FINISH DRAWING"}</Link> :
                  <Link
                      href={{
                        pathname: `/canvas/${curDrawings[0].id}`}}
                  > {"DRAW a drawing"}</Link> :
              isGuessing ?
                  myTurn ?
                      <Link href={{pathname: `/guess/${curGuessable[0].id}`}}><p>{`FINISH GUESSING`}</p></Link> :
                      <Link href={{pathname: `/guess/${curGuessable[0].id}`}}><p>{`TRY GUESSING`}</p></Link> :
                  someoneElse ? `${someoneElse} is ${someoneElseGuessing? 'guessing' : 'drawing'}`: 'invalid state.'

      }</p>
  {/*{curGuessable.length > 0 ?*/}
  {/*    <Link href={{pathname: `/guess/${curGuessable[0].id}`}}><p>{`Guess drawing for game ${curGuessable[0].game_id}`}</p></Link> : null}*/}
  {/*{pastDrawings.length > 0 ?*/}
  {/*    <div><p>{`You drew \"${pastDrawings[pastDrawings.length - 1].target_word}\"`}</p><img alt='past drawing' src={`${await getSignedUrl(pastDrawings[pastDrawings.length - 1].id)}`}/></div> : "no old games"}*/}
      </div>
    )
}