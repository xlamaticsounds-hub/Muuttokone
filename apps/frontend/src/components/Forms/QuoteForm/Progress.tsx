type Props = { step: number };
export default function Progress({ step }: Props) {
  return (
    <div className="mb-7.5 flex items-center gap-2 text-sm">
      <span className={`h-2 w-24 rounded-full ${step >= 1 ? "bg-primary" : "bg-stroke"}`} />
      <span className={`h-2 w-24 rounded-full ${step >= 2 ? "bg-primary" : "bg-stroke"}`} />
    </div>
  );
}
