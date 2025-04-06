import { component$, Slot } from "@builder.io/qwik";

export default component$(() => {
  return (
    <div class="flex flex-1 flex-col justify-between">
      <Slot />
    </div>
  );
});
