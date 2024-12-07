import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { useEffect, useRef } from "react";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}


/**
 * Hook that alerts clicks outside of the passed ref
 */
function useOutsideAlerter(ref,setOpen) {

    useEffect(() => {
        /**
         * Alert if clicked on outside of element
         */
        function handleClickOutside(event) {
            if (ref.current && !ref.current.contains(event.target)) {
                setOpen(false);
            }
        }
        // Bind the event listener
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            // Unbind the event listener on clean up
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [ref]);
}

/**
 * Component that alerts if you click outside of it
 */
export function OpenableComponent({children, setOpen}) {
    const wrapperRef = useRef(null);
    useOutsideAlerter(wrapperRef, setOpen);
    return <div ref={wrapperRef}><div>{children}</div></div>;
}

export async function saveImageToGCS(dataURL, filename) {
    const res = await fetch(`http://localhost:3000/upload_url`,{
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            file: filename
        })
    })
    const url = await res.json();
    const newUrl = new URL(url.url);
    const formData = new FormData();

    Object.entries(url.fields).forEach(([key, value]) => formData.append(key, value));
    formData.append('file', dataURLtoFile(dataURL, filename) as Blob);

    return await fetch(newUrl, {
        method: 'POST',
        body: formData
    })
}

function dataURLtoFile(dataurl, filename) {
    var arr = dataurl.split(','),
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[arr.length - 1]),
        n = bstr.length,
        u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
}