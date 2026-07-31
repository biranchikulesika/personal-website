import { Image } from './core/Image';
import { Link } from './core/Link';
import { Table, Td, Th } from './core/Table';
import { Pre } from './core/Pre';
import { H1, H2, H3, H4 } from './core/Heading';
import { Blockquote } from './core/Blockquote';
import { Callout } from './content/Callout';
import { YouTube } from './content/YouTube';

export const MDXComponents = {
  img: Image,
  Image,
  a: Link,
  table: Table,
  th: Th,
  td: Td,
  pre: Pre,
  h1: H1,
  h2: H2,
  h3: H3,
  h4: H4,
  blockquote: Blockquote,
  Callout,
  YouTube,
};
