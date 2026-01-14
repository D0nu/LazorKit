import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

interface DocPageProps {
  params: {
    slug: string;
  };
}

// This generates static paths at build time
export async function generateStaticParams() {
  const docsDir = path.join(process.cwd(), 'src', 'docs');
  
  // Check if directory exists
  if (!fs.existsSync(docsDir)) {
    return [];
  }
  
  const files = fs.readdirSync(docsDir);
  
  return files
    .filter(file => file.endsWith('.md'))
    .map(file => ({
      slug: file.replace('.md', '')
    }));
}

export default async function DocPage({ params }: DocPageProps) {
  const { slug } = params;
  const filePath = path.join(process.cwd(), 'src', 'docs', `${slug}.md`);
  
  // Handle file not found
  if (!fs.existsSync(filePath)) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Document Not Found</h1>
          <p className="text-gray-400 mb-8">
            The documentation page you're looking for doesn't exist.
          </p>
          <a href="/docs" className="btn btn-primary">
            Back to Documentation
          </a>
        </div>
      </div>
    );
  }
  
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const { content, data: frontmatter } = matter(fileContent);
  
  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <a 
            href="/docs" 
            className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Documentation
          </a>
          
          {frontmatter.title && (
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              {frontmatter.title}
            </h1>
          )}
          
          {frontmatter.description && (
            <p className="text-lg text-gray-400">
              {frontmatter.description}
            </p>
          )}
        </div>
        
        {/* Markdown Content */}
        <article className="prose prose-lg prose-invert max-w-none
          prose-headings:text-white prose-headings:font-bold
          prose-h1:text-3xl prose-h1:mb-6 prose-h1:mt-8
          prose-h2:text-2xl prose-h2:mb-4 prose-h2:mt-6 prose-h2:border-b prose-h2:border-gray-700 prose-h2:pb-2
          prose-h3:text-xl prose-h3:mb-3 prose-h3:mt-5
          prose-p:text-gray-300 prose-p:leading-relaxed
          prose-a:text-purple-400 prose-a:no-underline hover:prose-a:text-purple-300 hover:prose-a:underline
          prose-strong:text-white prose-strong:font-semibold
          prose-code:text-purple-300 prose-code:bg-gray-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
          prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-700 prose-pre:rounded-lg
          prose-ul:text-gray-300 prose-ul:list-disc
          prose-ol:text-gray-300 prose-ol:list-decimal
          prose-li:text-gray-300 prose-li:my-1
          prose-blockquote:border-l-4 prose-blockquote:border-purple-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-400
          prose-table:border prose-table:border-gray-700
          prose-th:bg-gray-800 prose-th:text-white prose-th:font-semibold prose-th:p-3
          prose-td:border prose-td:border-gray-700 prose-td:p-3
        ">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
          >
            {content}
          </ReactMarkdown>
        </article>
        
        {/* Footer Navigation */}
        <div className="mt-12 pt-8 border-t border-gray-700">
          <div className="flex justify-between items-center">
            <a 
              href="/docs"
              className="btn btn-secondary"
            >
              All Documentation
            </a>
            
            <a 
              href="https://docs.lazorkit.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              Official Docs
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: DocPageProps) {
  const { slug } = params;
  const filePath = path.join(process.cwd(), 'src', 'docs', `${slug}.md`);
  
  if (!fs.existsSync(filePath)) {
    return {
      title: 'Not Found | Lazorkit Docs',
    };
  }
  
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const { data: frontmatter } = matter(fileContent);
  
  return {
    title: frontmatter.title ? `${frontmatter.title} | Lazorkit Docs` : 'Documentation | Lazorkit',
    description: frontmatter.description || 'Learn how to use Lazorkit SDK',
  };
}