type Props = { value: string; onChange: (v: string) => void };

export default function MonthPicker({ value, onChange }: Props) {
  return (
    <input
      type="month"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
