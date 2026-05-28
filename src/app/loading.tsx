import { Loader2 } from 'lucide-react';

// Root-level loading state — shown during any top-level route transition
export default function Loading() {
  return (
    <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center">
      <Loader2 className="animate-spin text-[#ff385c]" size={36} />
    </div>
  );
}
