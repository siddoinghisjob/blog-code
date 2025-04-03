import { component$, Slot } from "@builder.io/qwik";

export default component$(() => {
  return (
    <div class="flex flex-1 flex-col justify-between">
      <div class = "px-4 p-3">
        <div class="bg-card h-fit rounded p-4 shadow">
          <h1 class="font-heading mb-4 text-3xl font-semibold">Blog</h1>
          <p class="font-main text-lg">
            Welcome to my blog where I share my thoughts, experiences, and
            tutorials on various topics in software development, from Python and
            Go to JavaScript frameworks like Qwik.
          </p>
        </div>
      </div>
      <Slot />
    </div>
  );
});
