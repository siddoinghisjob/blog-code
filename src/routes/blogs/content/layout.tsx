import { component$, Slot } from "@builder.io/qwik";
import "@fontsource-variable/fira-code/wght.css"

export default component$(() => {
    return (
        <div class="flex flex-1 flex-col justify-between p-4">
            <div class="bg-card rounded">
                <Slot/>
            </div>
        </div>
    )
})