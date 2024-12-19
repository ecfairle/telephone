import {MutableRefObject, useEffect, useRef} from "react";

/**
 * Hook that alerts clicks outside the passed ref
 */
function useOutsideAlerter(ref: MutableRefObject<null|HTMLDivElement>, setOpen: (open: boolean) => void) {

    useEffect(() => {
        /**
         * Alert if clicked on outside of element
         */
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current?.contains(event.target as Node)) {
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
export function OpenableComponent({children, setOpen} : {children: React.ReactNode, setOpen: (open: boolean) => void}) {
    const wrapperRef:MutableRefObject<null> = useRef(null);
    useOutsideAlerter(wrapperRef, setOpen);
    return <div ref={wrapperRef}><div>{children}</div></div>;
}