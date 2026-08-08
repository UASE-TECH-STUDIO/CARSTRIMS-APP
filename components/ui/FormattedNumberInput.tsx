"use client";

/**
 * A text input that displays digits with thousand-separator commas as
 * the user types (e.g. "5000000" reads back as "5,000,000"), so dealers
 * can visually verify how many zeros they've entered instead of miscounting
 * on a plain <input type="number">. Digits-only, integer values.
 *
 * The raw (comma-free) numeric string is what gets passed to onChange,
 * so it's a safe drop-in for existing form state that stores plain
 * numeric strings (e.g. form.sellingPrice) — no changes needed anywhere
 * else in the form's submit/validation logic.
 */
interface FormattedNumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> {
  value: string | number | undefined | null;
  onChange: (rawDigitsOnly: string) => void;
}

export default function FormattedNumberInput({
  value, onChange, ...rest
}: FormattedNumberInputProps) {
  const raw = value === undefined || value === null ? "" : String(value).replace(/,/g, "");
  const display = raw === "" ? "" : Number(raw).toLocaleString("en-US");

  return (
    <input
      {...rest}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={display}
      onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
    />
  );
}
