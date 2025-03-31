import { component$, Slot, useSignal, useTask$ } from "@builder.io/qwik";

export const PageTransition = component$(() => {
  const isVisible = useSignal(false);

  useTask$(() => {
    // Set to visible immediately for static generation
    isVisible.value = true;
  });

  return (
    <div
      class={{
        "opacity-0 transform translate-y-4": !isVisible.value,
        "opacity-100 transform translate-y-0": isVisible.value,
        "transition-all duration-500 ease-in-out": true,
      }}
    >
      <Slot />
    </div>
  );
});