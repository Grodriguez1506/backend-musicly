import { dirname } from "path";
import { fileURLToPath } from "url";

export const getRootPath = () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  return __dirname;
};
