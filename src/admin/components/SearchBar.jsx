import { Search } from "lucide-react";

function SearchBar({ value, onChange, placeholder = "Search..." }) {
  return (
    <label className="relative block w-full max-w-sm">
      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none ring-brand transition focus:border-brand focus:ring-2"
      />
    </label>
  );
}

export default SearchBar;
