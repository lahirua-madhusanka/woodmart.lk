import { get, safeRequest } from "./adminApi";
import { monthlyRevenue } from "../data/mockAdminData";

export const getDashboardStats = async () => {
  const data = await safeRequest(() => get("/admin/stats"), {
    totals: {
      products: 0,
      orders: 0,
      users: 0,
      revenue: 0,
    },
    recentOrders: [],
    lowStockProducts: [],
  });

  return {
    ...data,
    monthlyRevenue,
  };
};
