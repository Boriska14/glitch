import Link from "next/link";
import { formatDate } from "@/lib/volumes";
import type { Post } from "@/lib/types";

export default function PostRow({ post }: { post: Post }) {
  return (
    <li>
      <Link href={`/journal/${post.slug}`} className="post-row">
        <time dateTime={post.date}>{formatDate(post.date)}</time>
        <span className="pr-text">
          <strong>{post.title}</strong>
          {post.excerpt && <span>{post.excerpt}</span>}
        </span>
        {post.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={post.image} alt="" loading="lazy" />}
      </Link>
    </li>
  );
}
