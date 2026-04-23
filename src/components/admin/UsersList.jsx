import UserCard from './UserCard'

export default function UsersList({ users, onReset, onDelete }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-2">
      {users.map((user) => (
        <UserCard key={user.id} user={user} onReset={onReset} onDelete={onDelete} />
      ))}
    </div>
  )
}
