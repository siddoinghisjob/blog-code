import { component$ } from "@builder.io/qwik";
import { Link, type DocumentHead } from "@builder.io/qwik-city";
import { PageTransition } from "~/components/layout/utils/Pagetransition";

export default component$(() => {
  // Sample project data - you can move this to a separate data file later
  const projects = [
    {
      id: "url-shortener",
      title: "URL Shortener",
      description:
        "A web application that allows users to shorten long URLs into shorter, more manageable links with analytics and custom URL options.",
      tech: ["Go", "Gin", "Next.js", "PostgreSQL", "Redis", "Vercel"],
      links: {
        github: "https://github.com/siddoinghisjob/urlshortner",
        live: "https://urlshortner-mocha.vercel.app/",
      },
    },
    {
      id: "portfolio",
      title: "Portfolio Website",
      description:
        "My personal portfolio website built with Qwik, featuring a responsive design, blog functionality, and project showcase.",
      tech: ["Qwik", "TypeScript", "Tailwind CSS"],
      links: {
        github: "https://github.com/siddoinghisjob/blog-code",
        live: "https://siddoinghisjob.github.io/",
      },
    },
    {
      id: "hirefast",
      title: "HireFast",
      description:
        "A full-stack hiring application with user authentication, ability to post jobs, and conduct tests.",
      tech: [
        "NodeJS",
        "React",
        "Tailwind CSS",
        "PostgreSQL",
        "JWT Authentication",
      ],
      links: {
        github: "https://github.com/siddoinghisjob/HireFast",
        live: "https://hire-fast.vercel.app/",
      },
    },
    {
      id: "news-app",
      title: "News App",
      description:
        "A webapp for aggregating different news websites. But wait that means you can read news from different sources in one place. And very fast because of caching with Redis.",
      tech: ["JavaScript", "React JS", "RSS", "Vercel", "Redis"],
      links: {
        github: "https://github.com/siddoinghisjob/newAggregatorFrontend",
        live: "https://news-aggregator-frontend-gules.vercel.app/",
      },
    },
    {
      id: "movie-trivia",
      title: "Movie Buff",
      description:
        "An interactive movie searching web app powered by TMDB API. Features include show/movie recommendation, cast and crew info, and lot more. Frontend-only implementation.",
      tech: ["React", "TMDB API", "Tailwind CSS", "Vercel"],
      links: {
        github: "https://github.com/siddoinghisjob/movieBuff",
        live: "https://moviebuff.vercel.app/",
      },
    },
    {
      id: "bookshelf",
      title: "Bookshelf",
      description:
        "A book trivia built with Next.js and integrated with the OpenLibrary API. Features include user authentication, and book search functionality.",
      tech: [
        "Next.js",
        "OpenLibrary API",
        "JWT Authentication",
        "Tailwind CSS",
        "PostgreSQL",
      ],
      links: {
        github: "https://github.com/siddoinghisjob/bookapp",
        live: "https://bookapp-two.vercel.app/",
      },
    },
  ];

  return (
    <PageTransition>
      <main class="flex flex-col gap-8 p-4 px-5 md:p-8">
        <div class="bg-card rounded p-4 shadow md:p-8">
          <h1 class="font-heading mb-4 text-3xl font-semibold">Projects</h1>
          <p class="font-main mb-6 text-lg">
            Here are some of the projects I've worked on. Each project
            represents different technologies and problem-solving approaches
            I've used throughout my development journey.
          </p>
        </div>

        <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.id}
              class="bg-card flex h-full flex-col rounded p-4 shadow"
            >
              <span class="group relative mb-4">
                <p class="absolute top-[0.95rem] w-4 border-[1px]"></p>
                <p class="absolute top-3 ml-4 h-2 w-2 scale-100 rounded-full bg-white transition-all group-hover:scale-150"></p>
                <h2 class="font-heading ml-8 text-xl font-semibold">
                  {project.title}
                </h2>
              </span>

              <p class="font-main mb-4">{project.description}</p>

              <div class="mt-auto">
                <span class="group relative">
                  <p class="absolute top-[0.95rem] w-4 border-[1px]"></p>
                  <p class="absolute top-3 ml-4 h-2 w-2 scale-100 rounded-full bg-white transition-all group-hover:scale-150"></p>
                  <p class="text-md ml-8 font-semibold">Tech Stack</p>
                </span>

                <div class="mt-2 mb-4 ml-8 flex flex-wrap gap-2">
                  {project.tech.map((tech) => (
                    <span
                      key={tech}
                      class="bg-background rounded px-2 py-1 text-sm"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                <div class="ml-8 flex gap-4">
                  <Link
                    href={project.links.github}
                    target="_blank"
                    class="text-secondary flex items-center gap-1 hover:underline"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                    </svg>
                    GitHub
                  </Link>
                  <Link
                    href={project.links.live}
                    target="_blank"
                    class="text-secondary flex items-center gap-1 hover:underline"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                      <polyline points="15 3 21 3 21 9"></polyline>
                      <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                    Live Demo
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div class="bg-card mt-4 rounded p-4 shadow md:p-6">
          <p class="font-main text-center">
            Want to collaborate on a project? Feel free to
            <Link href="/contact" class="text-secondary ml-1 hover:underline">
              reach out to me
            </Link>
            .
          </p>
        </div>
      </main>
    </PageTransition>
  );
});

export const head: DocumentHead = {
  title: "Projects | Soumya Deep Sarkar",
  meta: [
    {
      name: "description",
      content:
        "Explore Soumya Deep Sarkar's projects including web applications, tools, and more built with various technologies.",
    },
  ],
};
