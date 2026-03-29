import { useMemo, useState } from "react";

function usePagination(data = [], pageSize = 10) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, page, pageSize]);

  const goToPage = (nextPage) => {
    setPage(Math.min(totalPages, Math.max(1, nextPage)));
  };

  return {
    page,
    pageSize,
    totalPages,
    data: paginated,
    setPage: goToPage,
  };
}

export default usePagination;
