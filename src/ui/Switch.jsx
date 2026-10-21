/** An on/off toggle rendered as a real button with role="switch". */
export function Switch({ checked, onChange, label, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`flex h-[30px] w-[54px] shrink-0 items-center rounded-full p-[3px] transition disabled:opacity-60 ${
        checked ? 'justify-end bg-sage' : 'justify-start bg-line'
      }`}
    >
      <span className="block size-6 rounded-full bg-white shadow" />
    </button>
  );
}
