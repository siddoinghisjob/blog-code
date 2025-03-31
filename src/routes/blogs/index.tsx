import { component$ } from "@builder.io/qwik";
import { Link, type DocumentHead } from "@builder.io/qwik-city";
import Blog from "~/components/layout/utils/blog";
import { PageTransition } from "~/components/layout/utils/Pagetransition";

export default component$(() => {
  // Sample blog posts - replace with your actual blog data
  interface blog{
    title: string;
    id: string;
    publishDate: string;
    readTime: string;
    tags: string[];
    excerpt: string;
  }
  const blogPosts:blog[] = [

];

  return (
    <PageTransition>
      <main class="flex flex-col gap-8 p-4 px-5 md:p-8">
        <div class="bg-card rounded p-4 shadow md:p-8">
          <h1 class="font-heading mb-4 text-3xl font-semibold">Blog</h1>
          <p class="font-main text-lg">
            Welcome to my blog where I share my thoughts, experiences, and
            tutorials on various topics in software development, from Python and
            Go to JavaScript frameworks like Qwik.
          </p>
        </div>

        <div class="flex flex-col gap-6">
          {blogPosts.map((post, key) => (
            <Blog
              key={key}
              title={post.title}
              id={post.id}
              publishDate={post.publishDate}
              readTime={post.readTime}
              tags={post.tags}
              excerpt={post.excerpt}
            />
          ))}
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
