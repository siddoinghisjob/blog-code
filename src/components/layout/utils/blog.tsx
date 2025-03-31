import { component$ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";

interface Props{
  key: number,
  id: string;
  title: string;
  publishDate: string;
  readTime: string;
  tags: string[];
  exerpt: string;
}

export default component$((props: Props) => {
  return (
    <Link key={props.id} href={`/blogs/${props.id}`} class="group">
      <article class="bg-card rounded p-5 shadow transition-transform duration-300 hover:-translate-y-1">
      <span class="group relative mb-4">
        <p class="absolute top-[0.95rem] w-4 border-[1px]"></p>
        <p class="absolute top-3 ml-4 h-2 w-2 scale-100 rounded-full bg-white transition-all group-hover:scale-150"></p>
        <h2 class="font-heading group-hover:text-secondary ml-8 text-xl font-semibold transition-colors">
        {props.title}
        </h2>
      </span>

      <div class="mt-2 mb-3 ml-8 flex items-center gap-2">
        <span class="text-secondary text-sm">{props.publishDate}</span>
        <span class="bg-secondary h-1 w-1 rounded-full"></span>
        <span class="text-secondary text-sm">{props.readTime}</span>
      </div>

      <div class="ml-8 flex flex-wrap gap-2">
        {props.tags.map((tag) => (
        <span key={tag} class="bg-background rounded px-2 py-1 text-sm">
          {tag}
        </span>
        ))}
      </div>
      </article>
    </Link>
  );
});
