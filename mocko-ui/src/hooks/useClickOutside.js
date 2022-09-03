import { useEffect } from "react";

export function useClickOutside(ref, handler) {
    useEffect(() => {
        function wrapper(event) {
            if(!ref?.current || ref?.current?.contains?.(event.target)) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            handler(event);
        }

        document.addEventListener('mousedown', wrapper);
        return () => document.removeEventListener('mousedown', wrapper);
    }, [ref, handler]);
}
