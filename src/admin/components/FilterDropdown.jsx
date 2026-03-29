function FilterDropdown({ value, options, onChange, label = "Filter" }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-muted">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-brand transition focus:border-brand focus:ring-2"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default FilterDropdown;
