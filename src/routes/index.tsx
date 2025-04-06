import { component$ } from "@builder.io/qwik";
import { Link, type DocumentHead } from "@builder.io/qwik-city";
import { PageTransition } from "~/components/layout/utils/Pagetransition";

export default component$(() => {
  const news_link =
    "https://www.business-standard.com/companies/news/pocket-fm-s-valuation-crosses-750-mn-bags-103-mn-in-series-d-funding-124032000902_1.html";
  return (
    <PageTransition>
      <main class="flex h-full flex-col gap-6 p-2 px-5 md:grid md:flex-grow md:grid-cols-4">
        <div class="bg-card flex flex-col rounded p-4 shadow md:col-span-3 md:p-8">
          <h1 class="font-heading text-3xl font-semibold">About me</h1>
          <div class="flex w-full flex-col gap-5 md:flex-1">
            <p class="font-main p-2 text-lg">
              I am a remote software engineer working at a Series D{" "}
              <Link href={news_link} target="_blank" class="underline">
                Startup
              </Link>{" "}
              with a passion for building scalable web applications. I have
              experience in Python, Go, and JavaScript, and I love learning new
              technologies. In my free time, I enjoy writing blogs and working
              on personal projects.
            </p>
            <p class="text-md p-2">
              You can find my blogs on various topics including Go, Qwik, and
              Python on this website.
            </p>
            <span class="mx-auto w-full">
              <span class="group relative">
                <p class="absolute top-[0.95rem] w-4 border-[1px]"></p>
                <p class="absolute top-3 ml-4 h-2 w-2 scale-100 rounded-full bg-white transition-all group-hover:scale-150"></p>
                <p class="ml-8 text-xl">Work Experience</p>
                <ul class="mt-2 ml-9 flex flex-col gap-4">
                  <span class="absolute top-0 left-[1.18rem] h-full border-[1px]"></span>
                  <li class="flex flex-col justify-between">
                    <span class="font-main relative flex flex-row gap-1 font-semibold">
                      <span class="absolute top-[0.6rem] -left-4 w-3 border-[1px]"></span>
                      <span class="text-md text-secondary font-light">
                        SDE Intern
                      </span>
                      <span>@ Pocket FM</span>
                    </span>
                    <p class="ml-4 font-light md:ml-2">
                      Launched Plans in 9 countries. Did code refactoring and
                      some stuff here and there like migrating from redis to
                      scylladb.
                    </p>
                  </li>
                  <li class="flex flex-col justify-between">
                    <span class="font-main relative flex flex-row gap-1 font-semibold">
                      <span class="absolute top-[0.6rem] -left-4 w-3 border-[1px]"></span>
                      <span class="text-md text-secondary font-light">
                        SDE Intern
                      </span>
                      <span>@ Tata Steel</span>
                    </span>
                    <p class="ml-4 font-light md:ml-2">
                      Boring work mostly like creating tableau dashboards and
                      presentations. One interesting thing was to create a POC
                      web tool for the marketing team so that they can levergage
                      generative AI for email marketing.
                    </p>
                  </li>
                </ul>
              </span>
            </span>
          </div>
        </div>
        <div class="bg-card flex h-full flex-col rounded p-2 shadow md:col-span-1 md:flex-1">
          <h2 class="font-heading mb-5 text-3xl font-semibold text-white">
            Projects
          </h2>
          <span class="mx-auto w-full">
            <span class="group relative">
              <p class="absolute top-[0.95rem] w-4 border-[1px]"></p>
              <p class="absolute top-3 ml-4 h-2 w-2 scale-100 rounded-full bg-white transition-all group-hover:scale-150"></p>
              <p class="ml-8 text-xl">URL Shortner</p>
              <ul class="mt-2 ml-9 flex flex-col gap-4">
                <span class="absolute top-0 left-[1.18rem] h-full border-[1px]"></span>
                <li class="group flex flex-col justify-between">
                  <span class="relative flex flex-row gap-1 font-semibold">
                    <span class="absolute top-[0.6rem] -left-4 w-3 border-[1px]"></span>
                    <span class="text-md font-main font-light transition-all group-hover:font-semibold">
                      Tech & Tools
                    </span>
                  </span>
                  <p class="ml-4 font-light md:ml-2">
                    Gin for backend, Next JS for frontend, PostgreSQL for DB and
                    Redis for cache. Oh yes Vercel for deployment.
                  </p>
                </li>
                <li class="group flex flex-col justify-between">
                  <span class="font-main relative flex flex-row gap-1 font-semibold">
                    <span class="absolute top-[0.6rem] -left-4 w-3 border-[1px]"></span>
                    <span class="text-md font-main font-light transition-all group-hover:font-semibold">
                      What?
                    </span>
                  </span>
                  <p class="ml-4 font-light md:ml-2">
                    URL shortner is a web application that allows users to
                    shorten long URLs into shorter, more manageable links. The
                    application also includes features such as analytics, and
                    the ability to customize short URLs for branding purposes.
                  </p>
                </li>
              </ul>
            </span>
          </span>
          <span class="relative min-h-12">
            <span class="absolute left-[1.2rem] h-5 border-[1px] border-dashed border-gray-500"></span>
            <Link href="project" class="absolute top-4 left-1 mt-2">
              {" "}
              see more
            </Link>
          </span>
        </div>
      </main>
    </PageTransition>
  );
});

export const head: DocumentHead = {
  title: "Soumya Deep Sarkar",
  meta: [
    {
      name: "description",
      content:
        "Soumya Deep Sarkar's personal website where he writes blogs on python, go and js including Qwik and showcases his projects.",
    },
  ],
  links: [
    {
      rel: "icon",
      type: "image/x-icon",
      href: "/favicon.ico",
    },
  ],
};
