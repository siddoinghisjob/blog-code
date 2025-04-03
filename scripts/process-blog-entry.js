import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import matter from "gray-matter";
import { fileURLToPath } from "url";
import MarkdownIt from "markdown-it";
import hljs from "highlight.js";
import htmlEmbed from "markdown-it-html5-embed";

// --- Configuration ---
const MAX_POSTS_PER_PAGE = 7;
const BLOG_CONTENT_DIR = "content/blogs"; // Relative to project root
const BLOG_ROUTES_DIR = path.join("src", "routes", "blogs"); // Relative to project root
const MAIN_BLOG_INDEX_PATH = path.join(BLOG_ROUTES_DIR, "index.tsx"); // Relative to project root
const BLOG_CARD_COMPONENT_PATH = "~/components/layout/utils/blog"; // Import path used in generated code
const PAGE_TRANSITION_COMPONENT_PATH = "~/components/layout/utils/Pagetransition"; // Import path used in generated code
const SITE_NAME = "Soumya Deep Sarkar"; // Used in <title> tags
const PAGINATION_MARKER_COMMENT = "{/* PAGINATION_CONTROLS_MARKER */}"; // Marker for pagination controls in main index
// --- End Configuration ---

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = process.cwd(); // Get project root directory

// --- Markdown Setup ---

// Custom Image Renderer for Qwik <Image> component
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

    if (srcIndex < 0) {
      console.warn("Image token missing src attribute:", token);
      return defaultRender(tokens, idx, options, env, self);
    }

    const src = token.attrs[srcIndex][1];
    const alt = altIndex >= 0 ? md.utils.escapeHtml(token.attrs[altIndex][1]) : "";

    // Consider making width/height configurable or smarter if possible
    return `<div class="my-8 flex justify-center">
      <Image
        layout="constrained"
        src="${src}"
        alt="${alt}"
        class="rounded-lg shadow-md max-w-full h-auto md:max-w-2xl"
        width={800}
        height={450}
      />
    </div>`;
  };
}

// Configure markdown parser
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="not-prose hljs-bg rounded-md overflow-x-auto"><code class="hljs language-${lang}">${
          hljs.highlight(str, { language: lang, ignoreIllegals: true }).value
        }</code></pre>`;
      } catch (e) {
        console.error(`Highlighting error for lang ${lang}:`, e);
      }
    }
    return `<pre class="not-prose hljs-bg rounded-md overflow-x-auto"><code class="hljs">${md.utils.escapeHtml(
      str,
    )}</code></pre>`;
  },
})
  .use(htmlEmbed, {
    useImageSize: false, // handled by customImageRender
  })
  .use(customImageRender);

// --- Git Helper ---

/**
 * Find newly added blog JSON files from the most recent git commit.
 * @returns {string[]} List of relative paths to new blog JSON files.
 */
function findNewBlogFiles() {
  try {
    // Ensure git command runs in the project root
    const gitOutput = execSync(
      "git diff-tree --no-commit-id --name-only -r HEAD",
      { encoding: "utf-8", cwd: PROJECT_ROOT }, // Specify encoding and working directory
    );
    const changedFiles = gitOutput.split("\n").filter((file) => file.trim());

    return changedFiles.filter(
      (file) => file.startsWith(BLOG_CONTENT_DIR + "/") && file.endsWith(".json"),
    );
  } catch (error) {
    console.error("Error finding new blog files via git:", error.message);
    // Check if it's a git error specifically
    if (error.stderr) {
        console.error("Git stderr:", error.stderr.toString());
    }
    return [];
  }
}

// --- File System Helpers ---

function ensureDirExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        try {
            fs.mkdirSync(dirPath, { recursive: true });
            console.log(`Created directory: ${path.relative(PROJECT_ROOT, dirPath)}`);
        } catch (err) {
            console.error(`Error creating directory ${dirPath}:`, err);
            throw err; // Re-throw to stop dependent operations
        }
    }
}

function readFileContent(filePath, encoding = 'utf-8') {
    try {
        return fs.readFileSync(filePath, encoding);
    } catch (err) {
        console.error(`Error reading file ${filePath}:`, err);
        throw err; // Re-throw
    }
}

function writeFileContent(filePath, content) {
    try {
        fs.writeFileSync(filePath, content);
        console.log(`✅ Wrote/Updated file: ${path.relative(PROJECT_ROOT, filePath)}`);
    } catch (err) {
        console.error(`❌ Error writing file ${filePath}:`, err);
        throw err; // Re-throw
    }
}

// --- Blog Generation ---

/**
 * Generate a Qwik blog page component (.tsx) from blog data and Markdown content.
 * @param {Object} blogData - The blog metadata.
 */
function generateBlogPage(blogData) {
  const { ID, Title, Author, Date: PublishDate, Tags = [], Location, Recommendation = [] } = blogData;

  if (!ID || !Title || !Author || !PublishDate) {
    console.error(`Blog data for ID ${ID || 'UNKNOWN'} is missing required fields (ID, Title, Author, Date). Skipping page generation.`);
    return; // Stop processing this entry if essential data is missing
  }

  const blogRouteDir = path.join(PROJECT_ROOT, BLOG_ROUTES_DIR, ID);
  const blogRouteIndexPath = path.join(blogRouteDir, "index.tsx");
  const markdownFilePath = Location ? path.join(PROJECT_ROOT, Location) : null;

  try {
      ensureDirExists(blogRouteDir); // Will throw if fails
  } catch {
      return; // Stop if directory can't be created
  }


  let htmlContent = "";
  let excerpt = blogData.excerpt || "Read this post to learn more.";

  if (markdownFilePath && fs.existsSync(markdownFilePath)) {
    try {
      const mdFileContent = readFileContent(markdownFilePath);
      const parsedMarkdown = matter(mdFileContent);
      htmlContent = md.render(parsedMarkdown.content);

      // Generate excerpt if not explicitly provided in JSON and markdown content exists
      if (!blogData.excerpt && parsedMarkdown.content) {
        const firstParagraphMatch = parsedMarkdown.content.match(/^\s*([^#\n].*)/m);
        if (firstParagraphMatch && firstParagraphMatch[1]) {
          excerpt = firstParagraphMatch[1].replace(/[#*_>`]/g, "").trim();
          // Optional: Truncate long excerpts
          // const MAX_EXCERPT_LENGTH = 160;
          // if (excerpt.length > MAX_EXCERPT_LENGTH) {
          //     excerpt = excerpt.substring(0, MAX_EXCERPT_LENGTH - 3) + "...";
          // }
        }
      }
    } catch (err) {
      console.error(`Error reading/parsing Markdown ${markdownFilePath}:`, err.message);
      htmlContent = "<p><em>Error loading blog content.</em></p>";
    }
  } else if (Location) {
    console.warn(`Markdown file specified but not found: ${markdownFilePath}`);
    htmlContent = "<p><em>Blog content could not be loaded.</em></p>";
  } else {
    console.warn(`No Markdown location specified for blog ID ${ID}.`);
    htmlContent = "<p><em>Blog content is not available.</em></p>";
  }

  // Escape content for template insertion
  const escapeString = (str = '') => str.replace(/`/g, "\\`").replace(/\$/g, "\\$"); // Added default empty string
  const escapeHtmlAttr = (str = '') => str.replace(/"/g, '"'); // Added default empty string

  const escapedHtmlContent = escapeString(htmlContent);
  const escapedTitle = escapeString(Title);
  const escapedAuthor = escapeString(Author);
  const escapedDescription = escapeHtmlAttr(excerpt.substring(0, 160)); // For meta tag
  const keywordsString = escapeHtmlAttr(Tags.join(", "));
  const headTitle = escapeHtmlAttr(Title); // For <title>

  // Handle recommendations (optional)
  const recommendationsHtml = Recommendation && Recommendation.length > 0 ? `
          <aside class="mt-12 pt-8 border-t border-border">
            <h2 class="text-xl font-semibold mb-4">Recommended Reading</h2>
            <ul class="list-none p-0 m-0 space-y-3">
              ${Recommendation.map(rec => `
              <li class="text-muted-foreground">
                <Link href="${escapeHtmlAttr(rec.location) || '#'}" class="text-primary hover:underline">${escapeString(rec.name || 'Related Post')}</Link>
                ${rec.author ? `<span class="text-sm"> by ${escapeString(rec.author)}</span>` : ''}
                ${rec.tags && rec.tags.length > 0 ? `
                <div class="mt-1 flex flex-wrap gap-1">
                  ${rec.tags.map(tag => `<span class="text-xs bg-secondary/10 text-secondary px-1.5 py-0.5 rounded">${escapeString(tag)}</span>`).join('')}
                </div>
                ` : ''}
              </li>`).join('\n              ')}
            </ul>
          </aside>` : '';

  // Create the Qwik component content
  const templateContent = `
import { component$ } from '@builder.io/qwik';
import { Link, type DocumentHead } from '@builder.io/qwik-city';
import { PageTransition } from '${PAGE_TRANSITION_COMPONENT_PATH}';
import { Image } from '@unpic/qwik';
import 'highlight.js/styles/github-dark.css'; // Ensure CSS is loaded

export default component$(() => {
  const blogHtml = \`${escapedHtmlContent}\`;

  return (
    <PageTransition>
      <main class="flex flex-col gap-8 p-4 px-5 md:p-8">
        <article class="bg-card text-card-foreground rounded-lg p-4 shadow-md md:p-8">
          <header class="mb-6 border-b border-border pb-4">
            <h1 class="font-heading mb-2 text-3xl font-semibold leading-tight tracking-tight md:text-4xl">${escapedTitle}</h1>
            <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <span>By ${escapedAuthor}</span>
              <span>Published on ${PublishDate}</span>
            </div>
            ${Tags && Tags.length > 0 ? `
            <div class="mt-4 flex flex-wrap gap-2">
              ${Tags.map((tag) => `<span class="inline-block bg-secondary/20 text-secondary rounded-full px-3 py-1 text-xs font-medium">${escapeHtmlAttr(tag)}</span>`).join("\n              ")}
            </div>` : ''}
          </header>

          <div
            class="prose prose-quoteless prose-neutral dark:prose-invert
                   prose-pre:bg-transparent prose-pre:p-0 prose-pre:my-6 prose-img:rounded-lg
                   max-w-none"
            dangerouslySetInnerHTML={blogHtml}
          >
            {/* Content injected here */}
          </div>
          ${recommendationsHtml}
        </article>
      </main>
    </PageTransition>
  );
});

export const head: DocumentHead = {
  title: "${headTitle} | ${SITE_NAME}",
  meta: [
    { name: "description", content: "${escapedDescription}", },
    { name: "keywords", content: "${keywordsString}", },
    { property: "og:title", content: "${headTitle}", },
    { property: "og:description", content: "${escapedDescription}", },
    // { property: "og:type", content: "article", },
    // { property: "article:published_time", content: "${new Date(PublishDate).toISOString()}", }, // Requires valid date parsing
    // { property: "article:author", content: "${Author}", },
  ],
};
`;

    try {
      writeFileContent(blogRouteIndexPath, templateContent);
    } catch {
        // Error logged by writeFileContent, stop further processing for this entry
        return;
    }
}

// --- Blog Index Update ---

/**
 * Updates the main blog index file with a new blog entry.
 * @param {Object} blogData - The blog metadata.
 * @returns {{success: boolean, updatedContent: string | null}} - Indicates if update was successful and returns the updated content.
 */
function updateBlogIndex(blogData) {
  const indexPath = path.join(PROJECT_ROOT, MAIN_BLOG_INDEX_PATH);
  const result = { success: false, updatedContent: null }; // Structure to return status and content

  if (!fs.existsSync(indexPath)) {
    console.error(`❌ Blog index file not found at: ${indexPath}. Cannot update.`);
    return result;
  }

  let indexContent;
  try {
    indexContent = readFileContent(indexPath);
  } catch (err) {
    return result; // Indicate failure reading
  }

  const blogPostsRegex = /(const blogPosts(?: *: *blog\[])? *= *\[)([\s\S]*?)(\];)/;
  const blogPostsMatch = indexContent.match(blogPostsRegex);

  if (!blogPostsMatch || blogPostsMatch.length < 4) {
    console.error("❌ Could not find valid `const blogPosts = [...]` array in", indexPath);
    return result; // Indicate failure parsing
  }

  const declarationStart = blogPostsMatch[1];
  const existingContent = blogPostsMatch[2].trim();
  const declarationEnd = blogPostsMatch[3];

  const { ID, Title, Date: PublishDate, Tags = [], Location } = blogData;

  // Prevent duplicates
  if (existingContent.includes(`id: "${ID}"`)) {
    console.warn(`⚠️ Blog post with ID "${ID}" already exists in ${indexPath}. Skipping index array update.`);
    // Even if skipping, return existing content for subsequent pagination check
    result.success = true; // Mark as 'success' because no error occurred, just skipped
    result.updatedContent = indexContent;
    return result;
  }

  // Calculate read time
  let readTime = "5 min read";
  if (Location && fs.existsSync(path.join(PROJECT_ROOT, Location))) {
    try {
      const mdFileContent = readFileContent(path.join(PROJECT_ROOT, Location));
      const parsed = matter(mdFileContent);
      const wordCount = parsed.content.split(/\s+/).filter(Boolean).length;
      const minutes = Math.max(1, Math.ceil(wordCount / 200));
      readTime = `${minutes} min read`;
    } catch (err) {
      console.warn(`Could not calculate read time for ${ID}: ${err.message}`);
    }
  }

  // Generate excerpt
  let excerpt = blogData.excerpt || "Click to read this blog post.";
  if (!blogData.excerpt && Location && fs.existsSync(path.join(PROJECT_ROOT, Location))) {
    try {
      const mdFileContent = readFileContent(path.join(PROJECT_ROOT, Location));
      const parsed = matter(mdFileContent);
      const firstParagraphMatch = parsed.content.match(/^\s*([^#\n].*)/m);
      if (firstParagraphMatch && firstParagraphMatch[1]) {
        excerpt = firstParagraphMatch[1].replace(/[#*_>`]/g, "").trim();
        // Truncate if needed
      }
    } catch (err) {
      console.warn(`Could not generate excerpt for ${ID}: ${err.message}`);
    }
  }

  // Escape strings for index object
  const escapeJsString = (str = '') => str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/`/g, '\\`').replace(/\$/g, '\\$');
  const escapedTitle = escapeJsString(Title);
  const escapedExcerpt = escapeJsString(excerpt);
  const tagsString = Tags && Tags.length > 0 ? Tags.map((tag) => `"${escapeJsString(tag)}"`).join(", ") : '';

  // Format the new blog post object string
  const newBlogPostString = `
  {
    id: "${ID}",
    title: "${escapedTitle}",
    publishDate: "${PublishDate}",
    excerpt: "${escapedExcerpt}",
    readTime: "${readTime}",
    tags: [${tagsString}],
  },`; // Comma is crucial

  // Construct the updated array string
  const updatedBlogPostsContent = `${declarationStart}${newBlogPostString}${existingContent ? '\n' + existingContent : ''}\n${declarationEnd}`;

  // Construct the full updated index content
  const updatedIndexContent = indexContent.replace(blogPostsMatch[0], updatedBlogPostsContent);

  // Write updated content back to the index file
  try {
    writeFileContent(indexPath, updatedIndexContent);
    result.success = true;
    result.updatedContent = updatedIndexContent; // Return the modified content
    return result;
  } catch(err) {
    result.success = false; // Explicitly mark failure on write error
    result.updatedContent = null;
    return result;
  }
}


// --- Pagination Handling ---

/**
 * Checks pagination and creates/updates pages based on post count.
 * Uses a marker comment in the main index for reliable control placement.
 * @param {string} [currentIndexContent] - Optional: Content of the index file to avoid re-reading.
 */
function checkAndCreatePagination(currentIndexContent) {
  console.log("\n--- Running Pagination Check ---");
  const indexPath = path.join(PROJECT_ROOT, MAIN_BLOG_INDEX_PATH);
  let indexContent = currentIndexContent;

  // Read content if not provided
  if (!indexContent) {
    if (!fs.existsSync(indexPath)) {
      console.warn("Pagination check skipped: Main index file not found at", indexPath);
      return;
    }
    try {
      indexContent = readFileContent(indexPath);
    } catch (err) {
      console.error(`Pagination check failed: Error reading ${indexPath}:`, err);
      return;
    }
  }

  // Extract blog posts array content
  const blogPostsRegex = /(const blogPosts(?: *: *blog\[])? *= *\[)([\s\S]*?)(\];)/;
  const blogPostsMatch = indexContent.match(blogPostsRegex);

  if (!blogPostsMatch || blogPostsMatch.length < 4) {
    console.warn("Pagination check failed: Could not find blogPosts array in", indexPath);
    return;
  }

  const blogPostsContentString = blogPostsMatch[2];
  // Count posts by 'id: "' which should be unique per post object
  const postCount = (blogPostsContentString.match(/id: "/g) || []).length;

  // --- DEBUG LOGS ---
  console.log(`PAGINATION_DEBUG: Post Count = ${postCount}`);
  console.log(`PAGINATION_DEBUG: MAX_POSTS_PER_PAGE = ${MAX_POSTS_PER_PAGE}`);
  // --- END DEBUG LOGS ---

  const totalPages = Math.ceil(postCount / MAX_POSTS_PER_PAGE);

  // --- DEBUG LOGS ---
  console.log(`PAGINATION_DEBUG: Calculated Total Pages = ${totalPages}`);
  // --- END DEBUG LOGS ---

  let paginationPagesCreatedOrUpdated = false; // Track if page files were touched

  // --- Create/Update Pagination Route Files (/blogs/1, /blogs/2, etc.) ---
  if (totalPages > 1) {
    console.log(`PAGINATION_DEBUG: Condition totalPages > 1 is TRUE. Entering pagination file creation logic.`);
    for (let pageNum = 1; pageNum < totalPages; pageNum++) { // pageNum 1 corresponds to /blogs/1 (second page)
      const pageRouteNum = pageNum;
      const pageDir = path.join(PROJECT_ROOT, BLOG_ROUTES_DIR, String(pageRouteNum));
      const pageIndexPath = path.join(pageDir, "index.tsx");

      console.log(`PAGINATION_DEBUG: Preparing page ${pageNum + 1} (route /${pageRouteNum})`);

      try {
          ensureDirExists(pageDir); // Will log creation or throw error
      } catch(err) {
          console.error(`Skipping pagination page ${pageNum + 1} due to directory error.`);
          continue; // Skip this page if dir creation fails
      }

      const startIdx = pageNum * MAX_POSTS_PER_PAGE;
      const endIdx = Math.min((pageNum + 1) * MAX_POSTS_PER_PAGE, postCount);
      const currentPageDisplayNum = pageNum + 1; // 1-based page number for display

      // Template for the pagination pages (/blogs/1, /blogs/2, etc.)
      const pageContent = `
import { component$ } from "@builder.io/qwik";
import { Link, type DocumentHead } from "@builder.io/qwik-city";
import BlogCard from "${BLOG_CARD_COMPONENT_PATH}";
import { PageTransition } from "${PAGE_TRANSITION_COMPONENT_PATH}";
import { blogPosts } from ".."; // Import the full list from the main index

export default component$(() => {
  const pagePosts = blogPosts.slice(${startIdx}, ${endIdx});
  // *** FIX IS HERE: Define currentPage inside the component scope ***
  const currentPage = ${currentPageDisplayNum};
  const totalPages = ${totalPages};

  return (
    <PageTransition>
      <main class="flex flex-col gap-8 p-4 px-5 md:p-8">
        <div class="bg-card text-card-foreground rounded-lg p-4 shadow-md md:p-8">
          <h1 class="font-heading mb-4 text-3xl font-semibold">Blog - Page {currentPage}</h1>
          <p class="text-muted-foreground">
            Page {currentPage} of {totalPages}. Browse through articles on software development and more.
          </p>
        </div>

        <div class="grid grid-cols-1 gap-6 md:grid-cols-1">
          {pagePosts.length > 0 ? pagePosts.slice(0,8).map((post, key) => (
            <BlogCard
              key={key} /* Use stable ID */
              title={post.title}
              id={post.id}
              publishDate={post.publishDate}
              readTime={post.readTime}
              tags={post.tags}
              excerpt={post.excerpt}
            />
          )) : (
            <p class="text-center text-muted-foreground">No posts found for this page.</p>
          )}
        </div>

        {/* Pagination Navigation */}
        <nav class="bg-card text-card-foreground mt-4 rounded-lg p-4 flex justify-between items-center shadow-md md:p-6" aria-label="Blog post pagination">
          {currentPage > 1 ? (
            <Link
              href={currentPage === 2 ? "/blogs" : \`/blogs/\${currentPage - 2}\`}
              class="text-primary hover:underline transition-colors duration-200"
            >
              ← Previous Page
            </Link>
          ) : (
            <span class="text-muted-foreground opacity-50 cursor-not-allowed" aria-disabled="true">← Previous Page</span>
          )}

          <span class="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>

          {currentPage < totalPages ? (
            <Link href={\`/blogs/\${currentPage}\`} class="text-primary hover:underline transition-colors duration-200">
              Next Page →
            </Link>
          ) : (
            <span class="text-muted-foreground opacity-50 cursor-not-allowed" aria-disabled="true">Next Page →</span>
          )}
        </nav>
      </main>
    </PageTransition>
  );
});

export const head: DocumentHead = {
  title: "Blog Page ${currentPageDisplayNum} | ${SITE_NAME}",
  meta: [
    {
      name: "description",
      content: "Page ${currentPageDisplayNum} of ${SITE_NAME}'s blog posts about software development, programming languages, and web technologies.",
    },
    // { name: "robots", content: "noindex, follow" } // Optional
  ],
};
`; // <<< End of pageContent template literal

      try {
          // Check if file exists and content is different before writing to potentially avoid unnecessary changes
          let needsWrite = true;
          if(fs.existsSync(pageIndexPath)) {
              const existingPageContent = readFileContent(pageIndexPath);
              if (existingPageContent === pageContent) {
                  needsWrite = false;
                  console.log(`PAGINATION_DEBUG: Content for ${pageIndexPath} is already up-to-date.`);
              }
          }

          if (needsWrite) {
              writeFileContent(pageIndexPath, pageContent); // Will log success/failure
              paginationPagesCreatedOrUpdated = true;
          }
      } catch (err) {
          // Error should have been logged by readFileContent or writeFileContent
          console.error(`PAGINATION_DEBUG: Failed to process pagination page ${pageIndexPath}.`)
      }
    } // end for loop for page creation
  } else {
    console.log(`PAGINATION_DEBUG: Condition totalPages <= 1 is TRUE. Pagination files not needed.`);
    // Optional: Cleanup - If you want to delete /blogs/1, /blogs/2 etc. when totalPages drops to 1
    // Be careful with rmSync! Example below requires careful testing.
    /*
    for (let pageNum = 1; ; pageNum++) {
       const pageDir = path.join(PROJECT_ROOT, BLOG_ROUTES_DIR, String(pageNum));
       if (fs.existsSync(pageDir)) {
           console.log(`PAGINATION_DEBUG: Removing obsolete pagination directory: ${pageDir}`);
           try {
               fs.rmSync(pageDir, { recursive: true, force: true });
           } catch (rmErr) {
               console.error(`PAGINATION_DEBUG: Error removing directory ${pageDir}:`, rmErr);
           }
       } else {
           break; // Stop when we don't find the next page number
       }
    }
    */
  }

  // --- Update Main Index Pagination Controls using Marker ---
  console.log(`PAGINATION_DEBUG: Updating main index controls. Total Pages = ${totalPages}`);
  // const paginationMarker = PAGINATION_MARKER_COMMENT; // Defined in constants
  const mainIndexPaginationNavRegex = /<nav.*?aria-label="Blog post pagination"[\s\S]*?<\/nav>/s; // Use /s for multi-line matching
  let updatedIndexContent = indexContent; // Start with the content we have
  let needsMainIndexWrite = false;

  // Ensure the marker exists in the content
  if (!indexContent.includes(PAGINATION_MARKER_COMMENT)) {
      console.error(`❌ PAGINATION_ERROR: Marker comment "${PAGINATION_MARKER_COMMENT}" not found in ${indexPath}. Cannot reliably update pagination controls. Please add it.`);
      // Even if we can't update controls, proceed if pagination pages were potentially updated
      console.log("--- Pagination Check Finished (Marker Missing) ---");
      return; // Stop control update logic if marker is missing
  }

  // Logic for what controls should be there
  let desiredNavContent = "";
  if (totalPages > 1) {
    // Need pagination controls for page 1
    desiredNavContent = `
        {/* Pagination Navigation */}
        <nav class="bg-card text-card-foreground mt-4 rounded-lg p-4 flex justify-between items-center shadow-md md:p-6" aria-label="Blog post pagination">
          <span class="text-muted-foreground opacity-50 cursor-not-allowed" aria-disabled="true">← Previous Page</span>
          <span class="text-sm text-muted-foreground">Page 1 of ${totalPages}</span>
          <Link href="/blogs/1" class="text-primary hover:underline transition-colors duration-200">
            Next Page →
          </Link>
        </nav>`;
  } // If totalPages <= 1, desiredNavContent remains "" (meaning remove existing controls)

  // Find existing controls using the regex
  const existingNavMatch = indexContent.match(mainIndexPaginationNavRegex);

  // Construct the replacement string: desired content + the marker
  const replacementString = `${desiredNavContent.trim() ? desiredNavContent + '\n' : ''}${PAGINATION_MARKER_COMMENT}`;

  // Escape the marker for use in the replacement regex
  const escapedMarker = PAGINATION_MARKER_COMMENT.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

  if (existingNavMatch) {
    // Replace the existing nav + marker block with the new nav + marker block
    // Try to find the existing nav AND the marker immediately after it (allowing whitespace)
    const blockToReplaceRegex = new RegExp(`(<nav.*?aria-label="Blog post pagination"[\\s\\S]*?<\\/nav>)\\s*${escapedMarker}`, 's');
    const blockMatch = indexContent.match(blockToReplaceRegex);

    if (blockMatch) {
        // Found nav immediately followed by marker
        updatedIndexContent = indexContent.replace(blockToReplaceRegex, replacementString);
        console.log(`PAGINATION_DEBUG: Replacing existing pagination controls block (nav + marker).`);
    } else {
        // Fallback: Marker might be separated, or nav doesn't exist right before marker.
        // Replace *just* the marker with the new nav + marker. This handles cases where nav was removed previously.
        updatedIndexContent = indexContent.replace(PAGINATION_MARKER_COMMENT, replacementString);
         console.log(`PAGINATION_DEBUG: Replacing marker with desired controls + marker (existing nav not found or separated).`);
    }
  } else {
    // No existing nav found by regex, replace just the marker with the new nav + marker
    updatedIndexContent = indexContent.replace(PAGINATION_MARKER_COMMENT, replacementString);
    console.log(`PAGINATION_DEBUG: Inserting pagination controls at marker (no existing nav found).`);
  }

  // Check if the content actually changed before writing
  if (updatedIndexContent !== indexContent) {
    needsMainIndexWrite = true;
  } else {
      console.log(`PAGINATION_DEBUG: Main index pagination controls already seem up-to-date.`);
  }

  // Write changes to main index only if needed
  if (needsMainIndexWrite) {
    try {
      // Use the original function to write, which logs success/failure
      writeFileContent(indexPath, updatedIndexContent);
    } catch (err) {
      // Error already logged by writeFileContent
    }
  }

  console.log("--- Pagination Check Finished ---");
}


// --- Main Processing Logic ---

/**
 * Process a single blog entry defined by a JSON file.
 * @param {string} jsonFilePath - Relative path to the blog JSON file.
 */
function processBlogEntry(jsonFilePath) {
  const fullJsonPath = path.join(PROJECT_ROOT, jsonFilePath);
  console.log(`\nProcessing entry: ${jsonFilePath}`);

  try {
    if (!fs.existsSync(fullJsonPath)) {
      throw new Error(`File not found: ${fullJsonPath}`);
    }

    const jsonContent = readFileContent(fullJsonPath);
    let blogData;
    try {
      blogData = JSON.parse(jsonContent);
    } catch (parseError) {
        throw new Error(`Invalid JSON in ${jsonFilePath}: ${parseError.message}`);
    }


    if (!blogData.ID || !blogData.Title || !blogData.Author || !blogData.Date) {
      throw new Error(`JSON file ${jsonFilePath} is missing required fields: ID, Title, Author, Date.`);
    }

    console.log(`  Title: ${blogData.Title}`);

    // 1. Generate the individual blog post page (.tsx file)
    // This function handles its own errors internally and returns void
    generateBlogPage(blogData);

    // 2. Update the main blog index file & trigger pagination check
    // This returns an object { success: boolean, updatedContent: string | null }
    const indexUpdateResult = updateBlogIndex(blogData);

    if (indexUpdateResult.success) {
        console.log(`✔️ Index update successful (or skipped) for: ${blogData.Title} (ID: ${blogData.ID})`);
        // Run pagination check using the potentially updated content
        checkAndCreatePagination(indexUpdateResult.updatedContent);
    } else {
        console.error(`❌ Failed to update index for blog: ${blogData.Title} (ID: ${blogData.ID}). Pagination check skipped due to index error.`);
    }


  } catch (error) {
    console.error(`❌ Error processing blog entry ${jsonFilePath}:`, error.message);
    // console.error(error); // Uncomment for stack trace if needed
  }
}

/**
 * Main function to orchestrate the blog processing workflow.
 */
function main() {
  console.log("🚀 Starting blog processing script...");

  const newBlogFiles = findNewBlogFiles();

  if (newBlogFiles.length === 0) {
    console.log("✅ No new blog JSON files detected in the last commit. Nothing to process.");
    return;
  }

  console.log(` Found ${newBlogFiles.length} new blog file(s):`);
  newBlogFiles.forEach(file => console.log(`  - ${file}`));

  // Process each new file sequentially
  // This ensures index updates happen before pagination checks rely on them
  newBlogFiles.forEach(processBlogEntry);

  // If no new files were processed but you still want to check pagination
  // (e.g., if MAX_POSTS_PER_PAGE changed), you could call checkAndCreatePagination() here unconditionally.
  // else {
  //   console.log("Checking pagination status even without new files...");
  //   checkAndCreatePagination(); // Check pagination based on current index state
  // }


  console.log("\n🏁 Blog processing finished.");
}

// --- Script Execution ---
main();