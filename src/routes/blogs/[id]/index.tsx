import { component$ } from "@builder.io/qwik";
import {
  Link,
  type StaticGenerateHandler,
  useLocation,
  type DocumentHead,
} from "@builder.io/qwik-city";
import Blog from "~/components/layout/utils/blog";
import { PageTransition } from "~/components/layout/utils/Pagetransition";
import data from "../../../../data/blog.json";

const perpage = 6;

export default component$(() => {
  const location = useLocation();
  const pagenum = Number(location.params.id);

  const totalPages = Math.ceil(data.blogs.length / 2);
  const nextpage = pagenum + 1;
  const prevpage = pagenum - 1;

  // Handle invalid page numbers
  if (isNaN(pagenum) || pagenum < 1 || data.blogs.length === 0) {
    return <div>Page not found.</div>;
  }
  return (
    <PageTransition>
      <main class="flex flex-col gap-8 p-4 px-5 md:p-8">
        <ul class="flex flex-col gap-6">
          {data.blogs
            .slice(
              perpage * (Number(location.params.id) - 1),
              Number(location.params.id) * perpage,
            )
            .map((blogs, key) => {
              return <Blog key={key} blog={blogs} />;
            })}
        </ul>

        {totalPages !== 1 && (
          <nav
            class="bg-card text-card-foreground mt-4 flex items-center justify-between rounded-lg p-4 shadow-md md:p-6"
            aria-label="Blog post pagination"
          >
            <Link
              href={"/blogs/" + prevpage}
              class={
                pagenum === 1
                  ? "text-muted-foreground cursor-not-allowed opacity-50"
                  : "text-primary transition-colors duration-200 hover:underline"
              }
              aria-disabled={pagenum === 1 ? "true" : "false"}
            >
              ← Previous Page
            </Link>

            <span class="text-muted-foreground text-sm">
              Page {pagenum} of {totalPages}
            </span>
            <Link
              href={"/blogs/" + nextpage}
              class={
                pagenum == totalPages
                  ? "text-muted-foreground cursor-not-allowed opacity-50"
                  : "text-primary transition-colors duration-200 hover:underline"
              }
              aria-disabled={pagenum === totalPages ? "true" : "false"}
            >
              Next Page →
            </Link>
          </nav>
        )}

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

export const onStaticGenerate: StaticGenerateHandler = () => {
  const totalPages = Math.ceil(data.blogs.length/perpage);
  const params = [];
  for (let i = 1; i <= totalPages; ++i) {
    params.push(i.toString());
  }
  return {
    params: params.map((id) => {
      return { id };
    }),
  };
};

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
