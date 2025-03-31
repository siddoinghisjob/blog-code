import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import html from 'markdown-it-html5-embed';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure markdown parser with syntax highlighting
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function(str, lang) {
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
  }
}).use(html, {
  useImageSize: true // allows setting image dimensions
});

/**
 * Find newly added blog files from the most recent git commit
 * @returns {string[]} List of paths to new blog JSON files
 */
function findNewBlogFiles() {
  try {
    const gitOutput = execSync('git diff-tree --no-commit-id --name-only -r HEAD').toString();
    const changedFiles = gitOutput.split('\n').filter(file => file.trim());
    
    return changedFiles.filter(file => 
      file.startsWith('content/blogs/') && file.endsWith('.json')
    );
  } catch (error) {
    console.error('Error finding new blog files:', error);
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
  const blogDir = path.join(process.cwd(), 'src', 'routes', 'blogs', ID);
  if (!fs.existsSync(blogDir)) {
    fs.mkdirSync(blogDir, { recursive: true });
  }
  
  // Process markdown content if it exists
  let htmlContent = '';
  if (Location && fs.existsSync(path.join(process.cwd(), Location))) {
    const mdContent = fs.readFileSync(path.join(process.cwd(), Location), 'utf-8');
    const parsed = matter(mdContent);
    
    // Convert markdown to HTML with syntax highlighting
    htmlContent = md.render(parsed.content);
  }
  
  // Create blog index.tsx file with properly escaped HTML content
  const templateContent = `
import { component$ } from '@builder.io/qwik';
import { type DocumentHead } from '@builder.io/qwik-city';
import { PageTransition } from '~/components/layout/utils/Pagetransition';
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
              ${Tags.map(tag => `<span class="bg-secondary/20 text-secondary rounded-full px-3 py-1 text-xs">${tag}</span>`).join('\n              ')}
            </div>
          </header>
          
          <div class="prose prose-pre:p-0 prose-pre:bg-transparent prose-pre:overflow-hidden max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: \`${htmlContent.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\` }}>
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
      content: "${Tags.join(', ')}",
    },
  ],
};
`;

  fs.writeFileSync(path.join(blogDir, 'index.tsx'), templateContent);
  console.log(`Created blog page for ${ID}`);
}

/**
 * Update the main blog index with the new blog entry
 * @param {Object} blogData - The blog metadata
 */
function updateBlogIndex(blogData) {
  const indexPath = path.join(process.cwd(), 'src', 'routes', 'blogs', 'index.tsx');
  
  if (!fs.existsSync(indexPath)) {
    console.error('Blog index file not found at:', indexPath);
    return;
  }
  
  let indexContent = fs.readFileSync(indexPath, 'utf-8');
  
  // Extract the blogPosts array
  const blogPostsMatch = indexContent.match(/const blogPosts = \[[\s\S]*?\];/);
  
  if (!blogPostsMatch) {
    console.error('Could not find blogPosts array in index.tsx');
    return;
  }
  
  // Get existing blog posts array
  const blogPostsStr = blogPostsMatch[0];
  
  // Create new blog post entry
  const { ID, Title, Date, Tags, Location } = blogData;
  
  // Calculate read time based on word count (1 min per 200 words)
  let readTime = "5 min read"; // Default
  if (Location && fs.existsSync(path.join(process.cwd(), Location))) {
    const content = fs.readFileSync(path.join(process.cwd(), Location), 'utf-8');
    const wordCount = content.split(/\s+/).length;
    const minutes = Math.max(1, Math.ceil(wordCount / 200));
    readTime = `${minutes} min read`;
  }
  
  // Create excerpt from the first paragraph
  let excerpt = "Click to read this blog post.";
  if (Location && fs.existsSync(path.join(process.cwd(), Location))) {
    const content = fs.readFileSync(path.join(process.cwd(), Location), 'utf-8');
    const parsed = matter(content);
    const firstParagraph = parsed.content.split('\n\n')[0]
      .replace(/[#*_>`]/g, '') // Remove markdown syntax
      .trim();
    
    excerpt = firstParagraph.substring(0, 150).trim();
    if (firstParagraph.length > 150) excerpt += "...";
  }
  
  // New blog post object
  const newBlogPost = `
    {
      id: "${ID}",
      title: "${Title}",
      publishDate: "${Date}",
      excerpt: "${excerpt.replace(/"/g, '\\"')}",
      readTime: "${readTime}",
      tags: [${Tags.map(tag => `"${tag}"`).join(', ')}],
    },`;
  
  // Insert the new blog post at the beginning of the array
  const updatedBlogPosts = blogPostsStr.replace(
    /const blogPosts = \[\n/,
    `const blogPosts = [\n${newBlogPost}\n`
  );
  
  // Replace the old blogPosts array with the updated one
  indexContent = indexContent.replace(blogPostsStr, updatedBlogPosts);
  
  // Write back to the file
  fs.writeFileSync(indexPath, indexContent);
  console.log('Updated blog index with new entry');
  
  // Check if pagination is needed
  checkAndCreatePagination();
}

/**
 * Create pagination pages if the number of blog posts exceeds the limit
 */
function checkAndCreatePagination() {
  const POSTS_PER_PAGE = 7;
  const indexPath = path.join(process.cwd(), 'src', 'routes', 'blogs', 'index.tsx');
  const indexContent = fs.readFileSync(indexPath, 'utf-8');
  
  // Extract the blogPosts array
  const blogPostsMatch = indexContent.match(/const blogPosts = \[[\s\S]*?\];/);
  if (!blogPostsMatch) return;
  
  // Count the number of blog posts
  const entriesCount = (blogPostsMatch[0].match(/id:/g) || []).length;
  
  console.log(`Total blog entries: ${entriesCount}`);
  
  if (entriesCount > POSTS_PER_PAGE) {
    console.log(`Creating pagination as entries exceed ${POSTS_PER_PAGE}`);
    
    // Calculate number of pages needed
    const pagesNeeded = Math.ceil(entriesCount / POSTS_PER_PAGE);
    
    // Create page folders and index files
    for (let i = 1; i <= pagesNeeded; i++) {
      const pageDir = path.join(process.cwd(), 'src', 'routes', 'blogs', 'page', String(i));
      if (!fs.existsSync(pageDir)) {
        fs.mkdirSync(pageDir, { recursive: true });
      }
      
      const startIndex = (i - 1) * POSTS_PER_PAGE;
      const endIndex = Math.min(startIndex + POSTS_PER_PAGE, entriesCount);
      
      const pageContent = `
import { component$ } from "@builder.io/qwik";
import { Link, type DocumentHead } from "@builder.io/qwik-city";
import Blog from "~/components/layout/utils/blog";
import { PageTransition } from "~/components/layout/utils/Pagetransition";

// Import blogPosts from main index
import { blogPosts } from "../../index";

export default component$(() => {
  // Get entries for this page (${startIndex} to ${endIndex - 1})
  const pageEntries = blogPosts.slice(${startIndex}, ${endIndex});

  return (
    <PageTransition>
      <main class="flex flex-col gap-8 p-4 px-5 md:p-8">
        <div class="bg-card rounded p-4 shadow md:p-8">
          <h1 class="font-heading mb-4 text-3xl font-semibold">Blog - Page ${i}</h1>
          <p class="font-main text-lg">
            Exploring software development topics and sharing knowledge.
          </p>
        </div>

        <div class="flex flex-col gap-6">
          {pageEntries.map((post, key) => (
            <Blog
              key={key}
              title={post.title}
              id={post.id}
              publishDate={post.publishDate}
              readTime={post.readTime}
              tags={post.tags}
              exerpt={post.excerpt}
            />
          ))}
        </div>

        <div class="flex justify-between mt-6">
          {${i > 1} && (
            <Link href="/blogs/page/${i-1}" class="bg-secondary text-white px-4 py-2 rounded hover:bg-secondary/80">
              Previous Page
            </Link>
          )}
          {${i === 1} && <div></div>}
          
          {${i < pagesNeeded} && (
            <Link href="/blogs/page/${i+1}" class="bg-secondary text-white px-4 py-2 rounded hover:bg-secondary/80">
              Next Page
            </Link>
          )}
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
  title: "Blog - Page ${i} | Soumya Deep Sarkar",
  meta: [
    {
      name: "description",
      content: "Page ${i} of Soumya Deep Sarkar's blog posts about software development and programming.",
    },
  ],
};
`;
      
      fs.writeFileSync(path.join(pageDir, 'index.tsx'), pageContent);
      console.log(`Created pagination page ${i}`);
    }
    
    // Update main index to show only first set of entries and add pagination link
    if (!indexContent.includes('pagination')) {
      // Add pagination link if it doesn't exist
      const updatedContent = indexContent.replace(
        /<div class="flex flex-col gap-6">[\s\S]*?<\/div>/,
        `<div class="flex flex-col gap-6">
          {blogPosts.slice(0, ${POSTS_PER_PAGE}).map((post, key) => (
            <Blog
              key={key}
              title={post.title}
              id={post.id}
              publishDate={post.publishDate}
              readTime={post.readTime}
              tags={post.tags}
              exerpt={post.excerpt}
            />
          ))}
        </div>
        
        <div class="flex justify-end mt-4">
          <Link href="/blogs/page/1" class="bg-secondary text-white px-4 py-2 rounded hover:bg-secondary/80">
            View More Posts
          </Link>
        </div>`
      );
      
      fs.writeFileSync(indexPath, updatedContent);
      console.log('Updated main index with pagination link');
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
    
    const jsonContent = fs.readFileSync(fullPath, 'utf-8');
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
    console.log('No new blog files to process');
    return;
  }
  
  newBlogFiles.forEach(processBlogEntry);
}

// Run the script
main();