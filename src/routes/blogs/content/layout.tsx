import { component$, Slot } from "@builder.io/qwik";
import "@fontsource-variable/fira-code/wght.css"

export default component$(() => {
    return (
        <div>
            <Slot/>
        </div>
    )
})