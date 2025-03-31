const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const matter = require('gray-matter');

// Find newly added blog files from git
function findNewBlogFiles() {
  try {
    // Get list of changed files in the last commit
    const gitOutput = execSync('git diff-tree --no-commit-id --name-only -r HEAD').toString();
    const changedFiles = gitOutput.split('\n').filter(file => file.trim());
    
    // Filter for JSON files in the content/blogs directory
    return changedFiles.filter(file => 
      file.startsWith('content/blogs/') && file.endsWith('.json')
    );
  } catch (error) {
    console.error('Error finding new blog files:', error);
    return [];
  }
}

// Generate blog page from template
function generateBlogPage(blogData) {
  const { ID, Title, Author, Date, Tags, Location } = blogData;
  
  // Ensure the directory exists
  const blogDir = path.join('src', 'routes', 'blogs', ID);
  if (!fs.existsSync(blogDir)) {
    fs.mkdirSync(blogDir, { recursive: true });
  }
  
  // Read markdown content if it exists
  let blogContent = '';
  if (Location && fs.existsSync(Location)) {
    const mdContent = fs.readFileSync(Location, 'utf-8');
    const parsed = matter(mdContent);
    blogContent = parsed.content;
  }
  
  // Create blog index.tsx file
  const templateContent = `
import { component$ } from '@builder.io/qwik';
import { type DocumentHead } from '@builder.io/qwik-city';
import { PageTransition } from '~/components/layout/utils/Pagetransition';

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
          
          <div class="prose max-w-none dark:prose-invert">
            ${blogContent.replace(/`/g, '\\`') || '<!-- Blog content will be inserted here -->'}
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

// Update main blog index with new entry
function updateBlogIndex(blogData) {
  const indexPath = path.join('src', 'routes', 'blogs', 'index.tsx');
  
  // Read existing blog index
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
  const { ID, Title, Date, Tags } = blogData;
  
  // Calculate approximate read time (1 min per 200 words)
  let readTime = "5 min read"; // Default
  if (blogData.Location && fs.existsSync(blogData.Location)) {
    const content = fs.readFileSync(blogData.Location, 'utf-8');
    const wordCount = content.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / 200);
    readTime = `${minutes} min read`;
  }
  
  // Create excerpt
  let excerpt = ""; 
  if (blogData.Location && fs.existsSync(blogData.Location)) {
    const content = fs.readFileSync(blogData.Location, 'utf-8');
    const parsed = matter(content);
    // Get first 150 characters as excerpt or use first paragraph
    const firstParagraph = parsed.content.split('\n\n')[0];
    excerpt = firstParagraph.substring(0, 150).trim();
    if (excerpt.length >= 150) excerpt += "...";
  } else {
    excerpt = "Click to read this blog post.";
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

// Check if pagination is needed and create pages
function checkAndCreatePagination() {
  const indexPath = path.join('src', 'routes', 'blogs', 'index.tsx');
  const indexContent = fs.readFileSync(indexPath, 'utf-8');
  
  // Extract the blogPosts array
  const blogPostsMatch = indexContent.match(/const blogPosts = \[[\s\S]*?\];/);
  if (!blogPostsMatch) return;
  
  // Count the number of blog posts
  const entriesCount = (blogPostsMatch[0].match(/id:/g) || []).length;
  
  console.log(`Total blog entries: ${entriesCount}`);
  
  if (entriesCount > 7) {
    console.log('Creating pagination as entries exceed 7');
    
    // Calculate number of pages needed
    const pagesNeeded = Math.ceil(entriesCount / 7);
    
    // Create page folders and index files
    for (let i = 1; i <= pagesNeeded; i++) {
      const pageDir = path.join('src', 'routes', 'blogs', 'page', String(i));
      if (!fs.existsSync(pageDir)) {
        fs.mkdirSync(pageDir, { recursive: true });
      }
      
      const startIndex = (i - 1) * 7;
      const endIndex = Math.min(startIndex + 7, entriesCount);
      
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
    
    // Update main index to show only first 7 entries and add pagination link
    if (!indexContent.includes('pagination')) {
      // Add pagination link if it doesn't exist
      const updatedContent = indexContent.replace(
        /<div class="flex flex-col gap-6">[\s\S]*?<\/div>/,
        `<div class="flex flex-col gap-6">
          {blogPosts.slice(0, 7).map((post, key) => (
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

// Process a blog entry from a JSON file
function processBlogEntry(jsonFilePath) {
  try {
    const jsonContent = fs.readFileSync(jsonFilePath, 'utf-8');
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

// Main function
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