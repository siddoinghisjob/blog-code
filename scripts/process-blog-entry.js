import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import matter from "gray-matter";
import { fileURLToPath } from "url";
import MarkdownIt from "markdown-it";
import hljs from "highlight.js";
import html from "markdown-it-html5-embed";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Image size plugin for markdown-it
function customImageRender(md) {
  const defaultRender =
    md.renderer.rules.image ||
    function (tokens, idx, options, env, self) {
      return self.renderToken(tokens, idx, options);
    };

  md.renderer.rules.image = function (tokens, idx, options, env, self) {
    const token = tokens[idx];
    const srcIndex = token.attrIndex("src");
    const altIndex = token.attrIndex("alt");

    const src = token.attrs[srcIndex][1];
    const alt = altIndex >= 0 ? token.attrs[altIndex][1] : "";

    // Replace standard <img> with the Qwik Image component JSX
    return `<div class="my-8 flex justify-center">
      <Image
        layout="constrained"
        src="${src}"
        alt="${alt}"
        class="rounded-lg shadow-md w-96"
        width={100}
        height={50}
      />
    </div>`;
  };
}

// Configure markdown parser with syntax highlighting
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="not-prose"><code class="hljs language-${lang}">${
          hljs.highlight(str, { language: lang, ignoreIllegals: true }).value
        }</code></pre>`;
      } catch (e) {
        console.error("Highlight error:", e);
      }
    }
    return `<pre class="not-prose"><code class="hljs">${md.utils.escapeHtml(str)}</code></pre>`;
  },
}).use(html, {
  useImageSize: true, // allows setting image dimensions
});

customImageRender(md);
/**
 * Find newly added blog files from the most recent git commit
 * @returns {string[]} List of paths to new blog JSON files
 */
function findNewBlogFiles() {
  try {
    const gitOutput = execSync(
      "git diff-tree --no-commit-id --name-only -r HEAD",
    ).toString();
    const changedFiles = gitOutput.split("\n").filter((file) => file.trim());

    return changedFiles.filter(
      (file) => file.startsWith("content/blogs/") && file.endsWith(".json"),
    );
  } catch (error) {
    console.error("Error finding new blog files:", error);
    return [];
  }
}

/**
 * Generate a blog page from the template using the provided blog data
 * @param {Object} blogData - The blog metadata and content information
 */
function generateBlogPage(blogData) {
  const { ID, Title, Author, Date, Tags, Location } = blogData;

  // Ensure the blog directory exists
  const blogDir = path.join(process.cwd(), "src", "routes", "blogs", ID);
  if (!fs.existsSync(blogDir)) {
    fs.mkdirSync(blogDir, { recursive: true });
  }

  // Process markdown content if it exists
  let htmlContent = "";
  if (Location && fs.existsSync(path.join(process.cwd(), Location))) {
    const mdContent = fs.readFileSync(
      path.join(process.cwd(), Location),
      "utf-8",
    );
    const parsed = matter(mdContent);

    // Convert markdown to HTML with syntax highlighting
    htmlContent = md.render(parsed.content);
  }

  // Create blog index.tsx file with properly escaped HTML content
  const templateContent = `
  import { component$ } from '@builder.io/qwik';
  import { type DocumentHead } from '@builder.io/qwik-city';
  import { PageTransition } from '~/components/layout/utils/Pagetransition';
  import { Image } from '@unpic/qwik';
  import 'highlight.js/styles/github-dark.css';
  
  export default component$(() => {
    return (
      <PageTransition>
        <main class="flex flex-col gap-8 p-4 px-5 md:p-8">
          <article class="bg-card rounded p-4 shadow md:p-8">
            <header class="mb-6">
              <h1 class="font-heading mb-2 text-3xl font-semibold">${Title}</h1>
              <div class="flex flex-wrap items-center gap-4 text-sm">
                <span class="text-muted-foreground">By ${Author}</span>
                <span class="text-muted-foreground">Published on ${Date}</span>
              </div>
              <div class="mt-3 flex flex-wrap gap-2">
                ${Tags.map((tag) => `<span class="bg-secondary/20 text-secondary rounded-full px-3 py-1 text-xs">${tag}</span>`).join("\n              ")}
              </div>
            </header>
            
            <div class="prose prose-pre:p-0 prose-pre:bg-transparent prose-pre:overflow-hidden max-w-none dark:prose-invert" dangerouslySetInnerHTML={\`${htmlContent.replace(/`/g, "\\`").replace(/\$/g, "\\$")}\`}>
            </div>
          </article>
        </main>
      </PageTransition>
    );
  });

export const head: DocumentHead = {
  title: "${Title} | Soumya Deep Sarkar",
  meta: [
    {
      name: "description",
      content: "${Title} - A blog post by ${Author}",
    },
    {
      name: "keywords",
      content: "${Tags.join(", ")}",
    },
  ],
};
`;

  fs.writeFileSync(path.join(blogDir, "index.tsx"), templateContent);
  console.log(`Created blog page for ${ID}`);
}

// ...existing code...

/**
 * Update the main blog index with the new blog entry
 * @param {Object} blogData - The blog metadata
 */
function updateBlogIndex(blogData) {
  const indexPath = path.join(
    process.cwd(),
    "src",
    "routes",
    "blogs",
    "index.tsx",
  );

  if (!fs.existsSync(indexPath)) {
    console.error("Blog index file not found at:", indexPath);
    return;
  }

  let indexContent = fs.readFileSync(indexPath, "utf-8");

  // Extract the blogPosts array - try different patterns to be more flexible
  let blogPostsStr;
  let blogPostsMatch = indexContent.match(
    /const blogPosts: blog\[\] = \[[\s\S]*?\];/,
  );

  if (!blogPostsMatch) {
    // Try alternative pattern without type annotation
    blogPostsMatch = indexContent.match(/const blogPosts = \[[\s\S]*?\];/);
  }

  if (!blogPostsMatch) {
    // One more try with a more generic pattern
    blogPostsMatch = indexContent.match(/const blogPosts.*?\[[\s\S]*?\];/);
  }

  if (!blogPostsMatch) {
    console.error("Could not find blogPosts array in index.tsx");
    return;
  }

  // Get existing blog posts array
  blogPostsStr = blogPostsMatch[0];

  // Create new blog post entry
  const { ID, Title, Date, Tags, Location } = blogData;

  // Calculate read time based on word count (1 min per 200 words)
  let readTime = "5 min read"; // Default
  if (Location && fs.existsSync(path.join(process.cwd(), Location))) {
    const content = fs.readFileSync(
      path.join(process.cwd(), Location),
      "utf-8",
    );
    const wordCount = content.split(/\s+/).length;
    const minutes = Math.max(1, Math.ceil(wordCount / 200));
    readTime = `${minutes} min read`;
  }

  // Create excerpt from the first paragraph
  let excerpt = "Click to read this blog post.";
  if (Location && fs.existsSync(path.join(process.cwd(), Location))) {
    const content = fs.readFileSync(
      path.join(process.cwd(), Location),
      "utf-8",
    );
    const parsed = matter(content);
    const firstParagraph = parsed.content
      .split("\n\n")[0]
      .replace(/[#*_>`]/g, "") // Remove markdown syntax
      .trim();

    excerpt = `${blogData.excerpt}`;
  }

  // New blog post object
  const newBlogPost = `
    {
      id: "${ID}",
      title: "${Title}",
      publishDate: "${Date}",
      excerpt: "${excerpt.replace(/"/g, '\\"')}",
      readTime: "${readTime}",
      tags: [${Tags.map((tag) => `"${tag}"`).join(", ")}],
    },`;

  // Insert the new blog post at the beginning of the array
  // Handle different patterns for the blog array declaration
  let updatedBlogPosts;

  if (blogPostsStr.includes("const blogPosts: blog[] = [")) {
    updatedBlogPosts = blogPostsStr.replace(
      /const blogPosts: blog\[\] = \[\s*\n?/,
      `const blogPosts: blog[] = [\n${newBlogPost}\n`,
    );
  } else if (blogPostsStr.includes("const blogPosts = [")) {
    updatedBlogPosts = blogPostsStr.replace(
      /const blogPosts = \[\s*\n?/,
      `const blogPosts = [\n${newBlogPost}\n`,
    );
  } else {
    // Generic fallback for any array declaration
    updatedBlogPosts = blogPostsStr.replace(/\[\s*\n?/, `[\n${newBlogPost}\n`);
  }

  // Replace the old blogPosts array with the updated one
  indexContent = indexContent.replace(blogPostsStr, updatedBlogPosts);

  // Write back to the file
  fs.writeFileSync(indexPath, indexContent);
  console.log("Updated blog index with new entry");

  // Check if pagination is needed
  checkAndCreatePagination();
}

/**
 * Create pagination pages if the number of blog posts exceeds the limit
 */
function checkAndCreatePagination() {
  // Maximum posts per page
  const MAX_POSTS_PER_PAGE = 7;

  // Get all blog posts
  const indexPath = path.join(
    process.cwd(),
    "src",
    "routes",
    "blogs",
    "index.tsx",
  );
  const indexContent = fs.readFileSync(indexPath, "utf-8");

  // Extract the blogPosts array - try different patterns to be more flexible
  let blogPostsMatch = indexContent.match(
    /const blogPosts.*? = \[([\s\S]*?)\];/,
  );

  if (!blogPostsMatch || !blogPostsMatch[1]) {
    console.log("Could not extract blog posts for pagination");
    return;
  }

  // Parse the blog posts
  const blogPostsContent = blogPostsMatch[1].trim();

  // Count the number of blog post objects (count opening braces)
  const postCount = (blogPostsContent.match(/{/g) || []).length;

  console.log(`Found ${postCount} blog posts`);

  // If we have more than the maximum posts per page, create pagination
  if (postCount > MAX_POSTS_PER_PAGE) {
    const numPages = Math.ceil(postCount / MAX_POSTS_PER_PAGE);

    // Create pagination pages (if they don't exist)
    for (let page = 1; page < numPages; page++) {
      const pageDir = path.join(
        process.cwd(),
        "src",
        "routes",
        "blogs",
        String(page),
      );
      const pageIndexPath = path.join(pageDir, "index.tsx");

      // Create directory if it doesn't exist
      if (!fs.existsSync(pageDir)) {
        fs.mkdirSync(pageDir, { recursive: true });
      }

      // Calculate start and end indices for this page
      const startIdx = page * MAX_POSTS_PER_PAGE;
      const endIdx = Math.min((page + 1) * MAX_POSTS_PER_PAGE, postCount);

      // Generate pagination page content
      const pageContent = `
import { component$ } from "@builder.io/qwik";
import { Link, type DocumentHead } from "@builder.io/qwik-city";
import Blog from "~/components/layout/utils/blog";
import { PageTransition } from "~/components/layout/utils/Pagetransition";
import { blogPosts } from "..";

export default component$(() => {
  // Get posts for this page (${startIdx} to ${endIdx - 1})
  const pagePosts = blogPosts.slice(${startIdx}, ${endIdx});
  
  return (
    <PageTransition>
      <main class="flex flex-col gap-8 p-4 px-5 md:p-8">
        <div class="bg-card rounded p-4 shadow md:p-8">
          <h1 class="font-heading mb-4 text-3xl font-semibold">Blog - Page ${page + 1}</h1>
          <p class="font-main text-lg">
            Welcome to my blog where I share my thoughts, experiences, and
            tutorials on various topics in software development, from Python and
            Go to JavaScript frameworks like Qwik.
          </p>
        </div>

        <div class="flex flex-col gap-6">
          {pagePosts.map((post, key) => (
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

        <div class="bg-card mt-4 rounded p-4 flex justify-between shadow md:p-6">
          <Link 
            href=${page > 1 ? `"/blogs/${page - 1}"` : '"/blogs"'} 
            class="text-secondary hover:underline"
          >
            ← Previous Page
          </Link>
          <span class="text-muted-foreground">Page ${page + 1} of ${numPages}</span>
          ${
            page < numPages - 1
              ? `<Link href="/blogs/${page + 1}" class="text-secondary hover:underline">Next Page →</Link>`
              : '<span class="text-secondary opacity-50">Next Page →</span>'
          }
        </div>
      </main>
    </PageTransition>
  );
});

export const head: DocumentHead = {
  title: "Blog Page ${page + 1} | Soumya Deep Sarkar",
  meta: [
    {
      name: "description",
      content: "Read Soumya Deep Sarkar's blog posts about software development, programming languages, and web technologies.",
    },
  ],
};
      `;

      // Write to file if it doesn't exist or needs updating
      fs.writeFileSync(pageIndexPath, pageContent);
      console.log(`Created pagination page ${page + 1}`);
    }

    // Also update the main index page to include pagination links
    if (!indexContent.includes("Page 1 of")) {
      // Add pagination controls to the main page
      const updatedIndexContent = indexContent.replace(
        '<div class="bg-card mt-4 rounded p-4 shadow md:p-6">',
        `<div class="bg-card mt-4 rounded p-4 flex justify-between shadow md:p-6">
          <span class="text-secondary opacity-50">← Previous Page</span>
          <span class="text-muted-foreground">Page 1 of ${numPages}</span>
          <Link href="/blogs/1" class="text-secondary hover:underline">Next Page →</Link>`,
      );

      fs.writeFileSync(indexPath, updatedIndexContent);
      console.log("Updated main index with pagination");
    }
  }
}
/**
 * Process a blog entry from a JSON file
 * @param {string} jsonFilePath - Path to the JSON file
 */
function processBlogEntry(jsonFilePath) {
  try {
    const fullPath = path.join(process.cwd(), jsonFilePath);
    console.log(`Reading file from: ${fullPath}`);

    const jsonContent = fs.readFileSync(fullPath, "utf-8");
    const blogData = JSON.parse(jsonContent);

    console.log(`Processing blog: ${blogData.Title}`);

    // Validate required fields
    if (!blogData.ID || !blogData.Title || !blogData.Author || !blogData.Date) {
      throw new Error(`Missing required fields in blog data: ${jsonFilePath}`);
    }

    // Generate the blog page
    generateBlogPage(blogData);

    // Update main blog index
    updateBlogIndex(blogData);

    console.log(`Successfully processed blog: ${blogData.Title}`);
  } catch (error) {
    console.error(`Error processing blog entry ${jsonFilePath}:`, error);
  }
}

/**
 * Main function to run the script
 */
function main() {
  const newBlogFiles = findNewBlogFiles();
  console.log(`Found ${newBlogFiles.length} new blog files`);

  if (newBlogFiles.length === 0) {
    console.log("No new blog files to process");
    return;
  }

  newBlogFiles.forEach(processBlogEntry);
}

// Run the script
main();
