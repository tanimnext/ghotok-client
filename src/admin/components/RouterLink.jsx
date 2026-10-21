import { Link } from 'react-router';

const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

/** Adapter so the shared UI kit's `href` links use react-router navigation (mailto:, https: and the like stay plain links). */
export function RouterLink({ href, ...rest }) {
  if (EXTERNAL.test(href)) return <a href={href} {...rest} />;
  return <Link to={href} {...rest} />;
}
