import { mockSettings } from "../data/mockAdminData";

let settings = { ...mockSettings };

export const getSettings = async () => ({ ...settings });

export const saveSettings = async (payload) => {
  settings = { ...settings, ...payload };
  return { ...settings };
};
