import { component$ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import {FaGithub} from "@qwikest/icons/font-awesome";

export default component$(() => {
  return (
    <div class="mt-auto w-full p-2">
      <footer class="bg-card flex w-full flex-col rounded p-3 px-5 shadow-2xl">
        <Link
          class=" hover:text-emerald-900 flex flex-wrap w-fit h-fit"
          href="https://github.com"
          target="_blank"
        >
          {" "}
          <FaGithub class="w-5 h-5"/>
        </Link>
      </footer>
    </div>
  );
});
