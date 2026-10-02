import { AlertCircle, LoaderCircle, Map } from "lucide-react";

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="state-block" role="status">
      <LoaderCircle className="spin" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="state-block state-block-error" role="alert">
      <AlertCircle aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="state-block">
      <Map aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
