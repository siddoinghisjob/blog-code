import { component$, type JSXOutput } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import {Image} from "@unpic/qwik";

interface image {
  name: string;
  location: string;
  skills: string[];
}

interface CardComponent {
  list: image[];
}

export default component$((props: CardComponent) => {
  const Images = props.list.map((image, index) => (
    <li
      key={index}
      class="bg-background relative flex flex-col rounded-lg text-white w-[30rem] h-[17rem]"
    >
      <Image
        layout="constrained"
        src={"../../../public/assets/" + image.location}
        class = "w-[30rem]"
      />
      <ul class = "absolute">
        <li class = "">React JS</li>
      </ul>
      <span class="flex justify-center p-2 flex-col align-middle">
        <Link href="/" class="hover:text-slate-500 m-auto">
          {image.name}
        </Link>
      </span>
    </li>
  )) as JSXOutput[];
  console.log(Images);
  return (
    <ul class="flex h-full w-full flex-wrap justify-center gap-10 px-2 py-8 align-middle">
      {Images}
    </ul>
  );
});
