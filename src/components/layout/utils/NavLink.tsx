import { component$, Slot } from '@builder.io/qwik';
import { Link, useLocation } from '@builder.io/qwik-city';

interface NavLinkProps {
  href: string;
  className?: string;
  activeClassName?: string;
}

export const NavLink = component$<NavLinkProps>(({ href, className = '', activeClassName = 'text-white pointer-events-none' }) => {
  const serialize = (path: string): string => {
    path = path.startsWith('/') ? path.slice(1,path.length) : `${path}`;
    path = path.endsWith('/') ? path.slice(0, path.length - 1) : `${path}`;
    return path;
  }
  const location = useLocation();
  const serialzedLoc = serialize(location.url.pathname);
  const serialzedPath = serialize(href);
  const isActive = serialzedLoc === serialzedPath;
  const combinedClassName = isActive 
    ? `${className} ${activeClassName}`.trim()
    : `${className} text-link hover:text-accent underline`.trim();
  
  return (
    <Link href={href} class={combinedClassName}>
      <Slot />
    </Link>
  );
});