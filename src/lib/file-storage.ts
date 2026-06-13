import { DbFileStorage } from "@/adapters/db-file-storage";
import type { FileStorage } from "@/ports/file-storage";

// Trocar por S3/Blob quando a integração entrar.
export const fileStorage: FileStorage = new DbFileStorage();
