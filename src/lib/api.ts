export async function joinRoom(userId:string, roomId:string) {
    const res = await fetch(`/join`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({
            room_id: roomId,
            user_id: userId
        })
    });
    return res;
}

export async function leaveRoom(userId:string, roomId:string) {
    const res = await fetch(`/leave`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({
            room_id: roomId,
            user_id: userId
        })
    });
    return res;
}

export async function uploadImage(dataURL:string, filename:string, gameDrawingId:string) {
    const res = await fetch(`/upload_url`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            filename
        })
    })
    const url = await res.json();
    const newUrl = new URL(url.url);
    const formData = new FormData();

    Object.entries(url.fields).forEach(([key, value]) => formData.append(key, value as string));
    formData.append('file', dataURLtoFile(dataURL, filename) as Blob);

    await fetch(newUrl, {
        method: 'POST',
        body: formData
    })

    await fetch(`/save_canvas/${gameDrawingId}`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            game_drawing_id: gameDrawingId,
        })
    })
}

function dataURLtoFile(dataurl:string, filename:string) {
    const arr = dataurl.split(','),
        mimeOrNull = arr[0].match(/:(.*?);/),
        mime = mimeOrNull ? mimeOrNull[1] : 'image/png',
        bstr = atob(arr[arr.length - 1]),
        n = bstr.length,
        u8arr = new Uint8Array(n);
    let i = n;
    while(i--){
        u8arr[i] = bstr.charCodeAt(i);
    }
    return new File([u8arr], filename, {type:mime});
}

export async function startNewGame(room_id:string) {
    await fetch(`/new_game`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            room_id
        })
    })
}

export async function getGame(game_id:string) {
    console.log('GAME ID' + game_id)
    return await fetch(`/game/${game_id}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
    })
}

export async function getRoomData() {
    return await fetch(`/get_room`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
    })
}

export async function getRoomById(room_id:string) {
    return await fetch(`/get_room/${room_id}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
    })
}

export async function createRoom(user_id:string) {
    return await fetch(`/create_room`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            user_id
        })
    })
}

export async function pullShuffle() {
    return await fetch(`/pull`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
        })
    })
}

export async function getShuffleGames() {
    return await fetch(`/shuffle_games`, {
        method: 'GET'
    })
}