import { PresenceUser } from '../../types/database';

interface Props {
  fieldName: string;
  presenceList: PresenceUser[];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function PresenceIndicator({ fieldName, presenceList }: Props) {
  const editing = presenceList.filter(p => p.editingField === fieldName);
  if (editing.length === 0) return null;

  return (
    <span className="inline-flex items-center gap-1 ml-2">
      {editing.map(p => (
        <span
          key={p.userId}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-semibold text-white animate-pulse"
          style={{ backgroundColor: p.color }}
          title={`${p.fullName} is editing this field`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white opacity-80" />
          {getInitials(p.fullName)}
        </span>
      ))}
    </span>
  );
}
