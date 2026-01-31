import { posts } from "../../../data/posts";

export async function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }) {
  const post = posts.find((entry) => entry.slug === params.slug);
  if (!post) return {};
  return {
    title: `${post.title} | VitaePro`,
    description: post.summary,
  };
}

export default function BlogPostPage({ params }) {
  const post = posts.find((entry) => entry.slug === params.slug);

  if (!post) {
    return (
      <div className="section-shell pb-16 pt-12">
        <h1 className="text-2xl font-semibold text-slate-900">Post not found</h1>
      </div>
    );
  }

  return (
    <article className="section-shell space-y-4 pb-16 pt-12">
      <p className="text-xs uppercase tracking-wide text-slate-500">{post.date}</p>
      <h1 className="text-4xl font-semibold text-slate-900">{post.title}</h1>
      <p className="text-base text-slate-700">{post.content}</p>
    </article>
  );
}
