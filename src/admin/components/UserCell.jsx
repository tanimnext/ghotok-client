import { Link } from 'react-router';

/** A user's name (linked to their account) with email/phone underneath. */
export function UserCell({ user }) {
  if (!user) return <span className="text-muted">—</span>;
  return (
    <span className="flex flex-col gap-0.5">
      <Link to={`/users/${user.id}`} className="font-bold hover:text-rose-text">
        {user.name}
      </Link>
      <span className="text-xs text-muted">{user.email ?? user.phoneNumber ?? user.phone}</span>
    </span>
  );
}
