/**
 * Book cover display: shows the physical 3D book representation
 * using the real cover image when available, or the textured
 * typography volume when no image is set.
 */
import { Book, type BookProps } from './book';

export function BookCover({
  title,
  author,
  cover,
  priority = false,
  link,
  className,
}: {
  title: string;
  author?: string;
  cover?: string;
  priority?: boolean;
  link?: string;
  className?: string;
}) {
  return (
    <Book
      title={title}
      author={author}
      cover={cover}
      priority={priority}
      link={link}
      className={className}
      fluid
      textured
    />
  );
}

export { Book, type BookProps };

