import Link from "next/link";
import { posts } from "../../data/posts";

export const metadata = {
  title: "Blog | VitaePro",
  description: "Long-form updates on outcome-first hiring, automation, and security.",
};

export default function BlogPage() {
  return (
    <div className="section-shell space-y-6 pb-16 pt-12">
      <h1 className="text-4xl font-semibold text-slate-900">Blog</h1>
      <p className="max-w-2xl text-lg text-slate-600">
        Publish long-form content to drive SEO. Posts below are sample entries; add more in src/data/posts.js or connect a CMS.
      </p>
      <div className="grid gap-6 md:grid-cols-3">
        {posts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="card flex flex-col p-5 transition hover:-translate-y-1 hover:shadow-md">
            <p className="text-xs uppercase tracking-wide text-slate-500">{post.date}</p>
            <h2 className="mt-3 text-lg font-semibold text-slate-900">{post.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{post.summary}</p>
            <span className="mt-4 text-sm font-semibold text-slate-800">Read more →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
