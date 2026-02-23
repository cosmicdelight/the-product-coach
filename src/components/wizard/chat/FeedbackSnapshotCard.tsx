import { Clock } from 'lucide-react';
import { FieldSnapshot } from '../../../types/chat';

interface Props {
  snapshot: FieldSnapshot[];
  snapshotTime: string;
  sectionLabel: string;
}

export function FeedbackSnapshotCard({ snapshot, snapshotTime, sectionLabel }: Props) {
  const nonEmpty = snapshot.filter(f => f.value.trim().length > 0);
  if (nonEmpty.length === 0) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 mb-2">
      <div className="flex items-center gap-1.5 mb-2.5">
        <Clock className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
        <span className="text-xs font-medium text-gray-500">
          {sectionLabel} reviewed as of {snapshotTime}
        </span>
      </div>
      <div className="space-y-2">
        {nonEmpty.map(field => (
          <div key={field.label}>
            <span className="text-xs font-semibold text-gray-500 block mb-0.5">{field.label}</span>
            <p className="text-xs text-gray-700 leading-relaxed bg-white border border-gray-200 rounded-lg px-2.5 py-1.5">
              {field.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
