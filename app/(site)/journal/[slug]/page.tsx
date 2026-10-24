import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPost } from "@/lib/substack";
import { formatDate } from "@/lib/volumes";
import Comments from "@/components/Comments";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await getPost((await params).slug);
  return p ? { title: p.title, description: p.excerpt } : {};
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const post = await getPost((await params).slug);
  if (!post) notFound();
  return (
    <>
    <article className="page narrow post">
      <Link href="/journal" className="textlink">← Journal</Link>
      <p className="kicker"><time dateTime={post.date}>{formatDate(post.date)}</time></p>
      <h1 className="page-title">{post.title}</h1>
      {post.html ? <div className="prose" dangerouslySetInnerHTML={{ __html: post.html }} /> : post.excerpt && <p className="lede">{post.excerpt}</p>}
      <p className="actions"><a className="btn" href={post.link} target="_blank" rel="noopener noreferrer">{post.html ? "Lire / commenter sur Substack ↗" : "Lire l'article sur Substack ↗"}</a></p>
    </article>
    <Comments type="post" slug={post.slug} />
    </>
  );
}
