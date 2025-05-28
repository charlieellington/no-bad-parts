export type Message =
  | { success: string }
  | { error: string }
  | { message: string };

export function FormMessage({ message }: { message: Message }) {
  const successText = (message as any).success as string | undefined;
  const errorText = (message as any).error as string | undefined;
  const infoText = (message as any).message as string | undefined;

  if (!successText && !errorText && !infoText) return null;

  return (
    <div className="flex flex-col gap-2 w-full max-w-md text-sm">
      {successText && (
        <div className="text-foreground border-l-2 border-foreground px-4">
          {successText}
        </div>
      )}
      {errorText && (
        <div className="text-destructive-foreground border-l-2 border-destructive-foreground px-4">
          {errorText}
        </div>
      )}
      {infoText && (
        <div className="text-foreground border-l-2 px-4">{infoText}</div>
      )}
    </div>
  );
}
