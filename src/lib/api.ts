export async function uploadImage(dataURL:string, filename:string, gameDrawingId:string) {
    const res = await fetch(`/upload_url`,{
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