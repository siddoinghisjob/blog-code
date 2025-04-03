import { component$ } from "@builder.io/qwik";
import { Link, type DocumentHead } from "@builder.io/qwik-city";
import { PageTransition } from "~/components/layout/utils/Pagetransition";
import data from "../../../../../data/content/typescript-best-practices.json";

export default component$(() => {
  return (
    <PageTransition>
      <main class="flex flex-col gap-8 p-4 px-5 md:p-8">
        <div class = "flex-1 flex h-full">
          {data.html}
        </div>

        <div class="bg-card mt-4 rounded p-4 shadow md:p-6">
          <p class="font-main text-center">
            Looking for a specific topic? Feel free to
            <Link href="/contact" class="text-secondary ml-1 hover:underline">
              request a blog post
            </Link>
            .
          </p>
        </div>
      </main>
    </PageTransition>
  );
});

export const head: DocumentHead = {
  title: "Blog | Soumya Deep Sarkar",
  meta: [
    {
      name: "description",
      content:
        "Read Soumya Deep Sarkar's blog posts about software development, programming languages, and web technologies.",
    },
  ],
};
