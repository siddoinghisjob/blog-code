import fs from "fs";
import path from "path";
import matter from "gray-matter";
import MarkdownIt from "markdown-it";
import hljs from "highlight.js";
import anchor from "markdown-it-anchor";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { execSync } from "child_process";

// Create __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --- Configuration ---
const CONTENT_DIR = path.join(__dirname, "../data/content"); // Source Markdown and JSON files
const BLOG_JSON_PATH = path.join(__dirname, "../data/blog.json"); // Central index file
const BLOG_OUTPUT_DIR = path.join(__dirname, "../src/routes/blogs/content"); // Output directory for generated .tsx files

// --- Helper Functions ---

// Function to ensure directory exists
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
}

// Function to get changed files in the current push
function getChangedFiles() {
  try {
    // Get the changed files in the current push
    const changedFilesOutput = execSync("git diff-tree --no-commit-id --name-only -r HEAD", { 
      encoding: "utf8" 
    });
    
    return changedFilesOutput.trim().split("\n").filter(Boolean);
  } catch (error) {
    console.error("Error getting changed files:", error.message);
    return null; // Return null to indicate that we couldn't get the changed files
  }
}

// --- Markdown Configuration ---

const md = new MarkdownIt({
  html: true, // Enable HTML tags in source
  breaks: true, // Convert '\n' in paragraphs into <br>
  linkify: true, // Autoconvert URL-like text to links
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        // Return HTML with hljs classes
        return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang, ignoreIllegals: true }).value}</code></pre>`;
      } catch (error) {
        // Log error instead of failing silently
        console.warn(`Could not highlight language ${lang}:`, error);
      }
    }
    // Use external default escaping if no lang or highlighting fails
    return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`;
  },
});

md.use(anchor, {
  // Change permalink style to remove # symbols from headings
  permalink: anchor.permalink.linkInsideHeader({
    symbol: "", // Empty string removes the # symbol
    placement: "before",
    class: "header-anchor",
    ariaHidden: false,
  }),
  // Fix slugify function to preserve hyphens in section names
  slugify: (s) => {
    // Keep spaces as hyphens for better readability in URLs
    const slug = String(s)
      .trim()
      .toLowerCase()
      // Replace spaces with hyphens FIRST
      .replace(/\s+/g, "-")
      // Then remove emoji and other special characters BUT KEEP HYPHENS
      .replace(/[^a-zA-Z0-9]/g, "");

    console.log(`Original: "${s}" → Slug: "${slug}"`);
    return slug;
  },
  // Add callback to log the exact IDs being generated
  callback: (token, info) => {
    console.log(`Heading: "${token.content}" → ID: "${info.slug}"`);
  },
});
md.renderer.rules.heading_open = function (tokens, idx, options, env, self) {
  // Get the heading token
  const headingToken = tokens[idx];

  // Check if it has an ID attribute
  const idIdx = headingToken.attrIndex("id");
  if (idIdx >= 0) {
    const id = headingToken.attrs[idIdx][1];
    console.log(`Generated heading with ID: ${id}`);
  }

  // Call the default renderer
  return self.renderToken(tokens, idx, options);
};

// Store the default image renderer (optional, as we override it completely now)
const defaultImageRenderer =
  md.renderer.rules.image ||
  function (tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
  };

// --- MODIFIED IMAGE RENDERER ---
// Custom image renderer: ALWAYS use Unpic's Image component for all images with a src.
md.renderer.rules.image = function (tokens, idx, options, env, self) {
  const token = tokens[idx];
  const srcIndex = token.attrIndex("src");
  const src = srcIndex >= 0 ? token.attrs[srcIndex][1] : "";
  const altIndex = token.attrIndex("alt");
  const alt = altIndex >= 0 ? token.attrs[altIndex][1] : "";
  const titleIndex = token.attrIndex("title");
  const title = titleIndex >= 0 ? token.attrs[titleIndex][1] : ""; // Optional title

  // If a src attribute exists, ALWAYS use the <Image> component
  if (src) {
    console.log(`Using <Image> component for: ${src}`); // Log which image is being processed

    // Escape alt and title attributes for safety in HTML
    const escapedAlt = md.utils.escapeHtml(alt);
    const escapedTitle = title ? md.utils.escapeHtml(title) : "";

    // Return the Qwik <Image> component string
    // Ensure @unpic/qwik is configured in your project to handle these sources correctly.
    return `<div class = "w-full flex flex-row justify-center align-middle"><Image src="${src}" layout="constrained" alt="${escapedAlt}" class="w-60" ${escapedTitle ? `title="${escapedTitle}"` : ""} /></div>`;
  }

  // Fallback: If somehow an image token has no src, return an empty string.
  return "";
};
// --- END OF MODIFIED IMAGE RENDERER ---

// --- Blog Data Loading ---
// (Keep the robust loading logic from the previous version)
let blogData;
try {
  ensureDirectoryExists(path.dirname(BLOG_JSON_PATH)); // Ensure parent directory exists

  if (fs.existsSync(BLOG_JSON_PATH)) {
    blogData = JSON.parse(fs.readFileSync(BLOG_JSON_PATH, "utf8"));
    if (!Array.isArray(blogData.blogs)) {
      console.warn(
        `'blogs' key in ${BLOG_JSON_PATH} is not an array. Initializing as empty.`,
      );
      blogData.blogs = [];
    }
  } else {
    console.log(`${BLOG_JSON_PATH} not found. Initializing new blog data.`);
    blogData = { blogs: [] };
  }
} catch (error) {
  console.error(`Error reading or parsing ${BLOG_JSON_PATH}:`, error);
  console.log("Initializing with empty blog data.");
  blogData = { blogs: [] };
}

// --- Core Processing Logic ---

function processBlogPosts() {
  console.log("Starting blog processing...");

  ensureDirectoryExists(CONTENT_DIR);
  ensureDirectoryExists(BLOG_OUTPUT_DIR);

  // Get list of changed files in the current push
  const changedFiles = getChangedFiles();
  
  if (!changedFiles) {
    console.log("Couldn't determine changed files. Processing all blog files.");
  } else {
    console.log(`Changed files in this push: ${changedFiles.length}`);
    
    // Filter to only include content directory files
    const changedContentFiles = changedFiles
      .filter(file => file.startsWith('data/content/'));
    console.log(changedFiles)
    console.log(`Changed content files: ${changedContentFiles.join(', ')}`);
    
    if (changedContentFiles.length === 0) {
      console.log("No blog content files were changed in this push. Exiting.");
      return;
    }
  }

  let contentFiles;
  try {
    contentFiles = fs.readdirSync(CONTENT_DIR);
  } catch (error) {
    console.error(`Error reading content directory ${CONTENT_DIR}:`, error);
    return;
  }

  const fileGroups = {};
  contentFiles.forEach((file) => {
    const ext = path.extname(file).toLowerCase();
    const baseName = path.basename(file, ext);
    
    // Skip files that weren't changed if we have a list of changed files
    if (changedFiles && !changedFiles.includes(`data/content/${file}`)) {
      // Check if we already have a valid blog entry for this file
      const existingEntry = blogData.blogs.find(blog => blog.id === baseName);
      if (existingEntry) {
        console.log(`Skipping unchanged file: ${file}`);
        return;
      }
    }
    
    if (!fileGroups[baseName]) fileGroups[baseName] = {};
    if (ext === ".md") fileGroups[baseName].markdown = file;
    else if (ext === ".json") fileGroups[baseName].json = file;
  });

  console.log(
    `Found ${Object.keys(fileGroups).length} blog entries to process.`,
  );

  let processedCount = 0;
  for (const fileBaseName of Object.keys(fileGroups)) {
    const files = fileGroups[fileBaseName];

    if (!files.markdown) {
      console.warn(`Skipping '${fileBaseName}': Missing markdown file.`);
      continue;
    }
    if (!files.json) {
      console.warn(`Skipping '${fileBaseName}': Missing json metadata file.`);
      continue;
    }

    try {
      console.log(`Processing blog with file base name: ${fileBaseName}`);

      const metadataPath = path.join(CONTENT_DIR, files.json);
      const contentPath = path.join(CONTENT_DIR, files.markdown);

      let metadata;
      try {
        metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
      } catch (jsonError) {
        console.error(
          `Error parsing metadata JSON for ${fileBaseName} (${files.json}):`,
          jsonError,
        );
        continue;
      }

      // Use the ID from the JSON metadata instead of the filename
      const blogId = metadata.id || fileBaseName;
      console.log(`Using blog ID: ${blogId} (from ${files.json})`);

      if (!metadata.title || !metadata.author || !metadata.publishDate) {
        console.warn(
          `Skipping '${blogId}': Metadata is missing required fields (title, author, date).`,
        );
        continue;
      }
      metadata.recommendation_list = Array.isArray(metadata.recommendation_list)
        ? metadata.recommendation_list
        : [];

      const fileContent = fs.readFileSync(contentPath, "utf8");
      const { content: markdownContent } = matter(fileContent);
      const htmlContent = md.render(markdownContent);

      const outputDir = path.join(BLOG_OUTPUT_DIR, blogId);
      ensureDirectoryExists(outputDir);

      const blogComponent = generateBlogComponent(
        htmlContent,
        metadata,
        blogId,
      );
      const outputFilePath = path.join(outputDir, "index.tsx");
      fs.writeFileSync(outputFilePath, blogComponent);
      console.log(`Generated component: ${outputFilePath}`);

      updateBlogJson(blogId, metadata);

      processedCount++;
      console.log(`Successfully processed blog: ${metadata.title}`);
    } catch (error) {
      console.error(`Error processing blog ${fileBaseName}:`, error);
    }
  }

  if (processedCount > 0) {
    try {
      fs.writeFileSync(BLOG_JSON_PATH, JSON.stringify(blogData, null, 2));
      console.log(`Successfully updated ${BLOG_JSON_PATH}`);
    } catch (error) {
      console.error(`Error writing updated ${BLOG_JSON_PATH}:`, error);
    }
  } else {
    console.log("No blog entries were processed. Skipping blog.json update.");
  }

  console.log(
    `Blog processing completed. Processed ${processedCount} blog entries.`,
  );
}

// --- Component Generation Functions ---
// (generateBlogComponent and generateRecommendations remain the same as the previous robust version)

function generateBlogComponent(htmlContent, metadata, blogId) {
  const escapedHtmlContent = JSON.stringify(htmlContent);
  const escapedTitle = metadata.title.replace(/[`$]/g, "\\$&");
  const escapedAuthor = metadata.author.replace(/[`$]/g, "\\$&");
  const escapedDescription =
    `${escapedTitle} - Blog post by ${escapedAuthor}`.replace(/[`$]/g, "\\$&");

  // IMPORTANT: Make sure Image is imported here, as it's now needed inside the dangerouslySetInnerHTML content
  return `// Generated by build script - Do not edit manually
import { component$ } from "@builder.io/qwik";
import { Link, type DocumentHead } from "@builder.io/qwik-city";
import { PageTransition } from "~/components/layout/utils/Pagetransition"; // Adjust path if needed
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Image } from '@unpic/qwik'; // Ensure Image is imported

export default component$(() => {
  const blogHtmlContent = ${escapedHtmlContent};

  return (
    <PageTransition>
      <main class="flex flex-col p-4 px-5 md:p-8">
        <article class="flex-1 flex flex-col h-full">
          <header class="mb-6">
            <h1 class="text-3xl font-bold mb-2">${escapedTitle}</h1>
            <div class="flex flex-wrap gap-x-3 gap-y-1 items-center">
              <span class="text-sm text-gray-600">By ${escapedAuthor}</span>
              <span class="text-sm text-gray-600">•</span>
              <time class="text-sm text-gray-600" dateTime="${metadata.publishDate}">${metadata.publishDate}</time>
            </div>
          </header>
          
          {/* The 'Image' component needs to be available in the scope where this HTML is rendered */}
          <div class="prose max-w-none lg:prose-lg xl:prose-xl" dangerouslySetInnerHTML={blogHtmlContent}>
          </div>
          
          ${generateRecommendations(metadata.recommendation_list, blogId)}
        </article>

        <aside class="bg-card mt-4 rounded p-4 shadow md:p-6">
          <p class="font-main text-center">
            Looking for a specific topic? Feel free to
            <Link href="/contact" class="text-secondary ml-1 hover:underline">
              request a blog post
            </Link>
            .
          </p>
        </aside>
      </main>
    </PageTransition>
  );
});

export const head: DocumentHead = {
  title: "${escapedTitle} | Soumya Deep Sarkar", // Adjust site name
  meta: [
    { name: "description", content: "${escapedDescription}" },
    { name: "author", content: "${escapedAuthor}" },
    // Add other meta tags as needed (OG, Twitter cards, etc.)
  ],
};
`;
}

function generateRecommendations(recommendationList, currentBlogId) {
  if (!recommendationList || recommendationList.length === 0) {
    return "<div>No recommendations provided</div>";
  }

  let recommendationsHtml = `
<section class="mt-12 border-t pt-8" aria-labelledby="recommendations-heading">
  <h2 id="recommendations-heading" class="text-2xl font-semibold mb-4">Recommended Posts</h2>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
`;

  let count = 0;
  for (const recId of recommendationList) {
    if (recId === currentBlogId) continue;
    const recPost = blogData.blogs.find((blog) => blog.id === recId);

    if (recPost) {
      const escapedRecTitle = md.utils.escapeHtml(recPost.title);
      const escapedRecAuthor = md.utils.escapeHtml(recPost.author);

      recommendationsHtml += `
    <div class="bg-card rounded-lg shadow-md overflow-hidden transition-shadow duration-200 hover:shadow-lg">
      <Link href="/blogs/content/${recPost.id}/" class="block p-4 h-full">
        <h3 class="font-semibold text-lg mb-1">${escapedRecTitle}</h3>
        <p class="text-sm text-gray-600">By ${escapedRecAuthor}</p>
      </Link>
    </div>
    `;
      count++;
    } else {
      console.warn(
        `Recommendation ID '${recId}' mentioned in '${currentBlogId}' not found in blog.json.`,
      );
    }
  }

  recommendationsHtml += `
  </div>
</section>
`;

  return count > 0
    ? recommendationsHtml
    : "<div class = 'm-auto p-2 border-t-2'>No recommendations found</div>";
}

// --- blog.json Update Function ---
function updateBlogJson(id, metadata) {
  const existingBlogIndex = blogData.blogs.findIndex((blog) => blog.id === id);
  const blogEntry = {
    id: id,
    title: metadata.title,
    publishDate: metadata.publishDate,
    readTime: metadata.readTime || "5 min",
    tags: metadata.tags || [],
    excerpt: metadata.excerpt || "",
    author: metadata.author,
  };

  if (existingBlogIndex >= 0) {
    blogData.blogs[existingBlogIndex] = blogEntry;
    console.log(`Updated entry in blog.json for: ${id}`);
  } else {
    blogData.blogs.push(blogEntry);
    console.log(`Added new entry to blog.json for: ${id}`);
  }

  // Optional: Sort blogs by date (newest first)
  blogData.blogs.sort(
    (a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime(),
  );
}

// --- Run the Process ---
processBlogPosts();
