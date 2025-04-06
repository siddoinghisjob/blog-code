import { component$ } from "@builder.io/qwik";
import { NavLink } from "./utils/NavLink";

export default component$(() => {
  return (
    <div class="mt-auto w-full p-2">
      <span class="bg-card rounded p-3 px-5 shadow-2xl w-full flex flex-col">
        <h1 class="font-heading text-2xl md:text-4xl">Soumya Deep Sarkar</h1>
        <span class = "p-2 pb-0 flex flex-wrap gap-1.5 text-md">
          <NavLink href="/">Home</NavLink>
          <NavLink href="/blogs/1">Blogs</NavLink>
        </span>
      </span>
    </div>
  );
});
