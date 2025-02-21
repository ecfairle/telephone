import React from "react";

export default function GameBlurb() {
    return (
        <div className={'border border-black text-center justify-center mt-5 p-2'}>
            <h2>How to play:</h2>
            <br/>
            Join a room with 1-4 friends to play. Every day there are a new set of words. When you start the
            game,
            a word will be randomly assigned to each player. <br/>For each word, the first player will draw
            that word. Then, the next
            player in order will guess the
            first player&apos;s drawing, and the next player will draw the second player&apos;s guess. And so on. At
            the end,
            see how the original word morphed being passed between everyone!
        </div>
    )
}