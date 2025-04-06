import {
  component$,
  Slot,
  createContextId,
  useContextProvider,
  useStore,
} from "@builder.io/qwik";
import type { RequestHandler } from "@builder.io/qwik-city";
import Footer from "~/components/layout/footer";
import Header from "~/components/layout/header";
import "@fontsource/kalam";
import "@fontsource-variable/inter/wght.css";

// Create a context for transition state
export const TransitionContext = createContextId<{ isTransitioning: boolean }>(
  "transition-context",
);

export const onGet: RequestHandler = async ({ cacheControl }) => {
  // Control caching for this request for best performance and to reduce hosting costs:
  // https://qwik.dev/docs/caching/
  cacheControl({
    // Always serve a cached response by default, up to a week stale
    staleWhileRevalidate: 60 * 60 * 24 * 7,
    // Max once every 5 seconds, revalidate on the server to get a fresh version of this page
    maxAge: 5,
  });
};

export default component$(() => {
  // Create a store for the transition state
  const transitionState = useStore({
    isTransitioning: false,
  });

  // Provide the transition state to all child components
  useContextProvider(TransitionContext, transitionState);

  return (
      <div class="text-text flex min-h-screen flex-col justify-between">
        <span><Header /></span>
        <Slot />
        <span><Footer /></span>
      </div>
  );
});
