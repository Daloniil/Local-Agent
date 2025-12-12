import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as path from "path";
import * as fs from "fs";

@Injectable()
export class FilesService {
  private allowedRoots: string[];
  private maxFileSize: number;
  private allowWrite: boolean;
  private allowDelete: boolean;

  constructor(private configService: ConfigService) {
    const roots = this.configService.get<string>("ALLOWED_ROOTS");
    this.allowedRoots = roots
      ? roots.split(",").map((r) => path.resolve(r.trim()))
      : [];
    this.maxFileSize =
      this.configService.get<number>("MAX_FILE_SIZE_MB", 2) * 1024 * 1024;
    this.allowWrite = this.configService.get<boolean>("ALLOW_WRITE", false);
    this.allowDelete = this.configService.get<boolean>("ALLOW_DELETE", false);
  }

  isAllowedPath(targetPath: string): boolean {
    if (!targetPath) {
      return false;
    }

    const resolvedPath = path.resolve(targetPath);

    try {
      const realPath = fs.realpathSync(resolvedPath);
      if (this.allowedRoots.some((root) => realPath.startsWith(root))) {
        return true;
      }
    } catch (error) {
      return false;
    }

    return this.allowedRoots.some((root) => resolvedPath.startsWith(root));
  }

  async listFiles(directoryPath: string) {
    const resolvedPath = path.resolve(directoryPath);
    const entries = await fs.promises.readdir(resolvedPath, {
      withFileTypes: true,
    });

    const fileList = await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(resolvedPath, entry.name);
        const stats = await fs.promises.stat(fullPath);
        return {
          name: entry.name,
          isDirectory: entry.isDirectory(),
          isFile: entry.isFile(),
          size: stats.size,
          birthtime: stats.birthtime,
          mtime: stats.mtime,
        };
      })
    );
    return fileList;
  }

  async readFile(filePath: string, previewLines?: number): Promise<string> {
    const resolvedPath = path.resolve(filePath);
    const stats = await fs.promises.stat(resolvedPath);

    if (!stats.isFile()) {
      throw new Error("Path is not a file.");
    }

    if (stats.size > this.maxFileSize) {
      throw new Error(
        `File size exceeds the limit of ${this.maxFileSize / (1024 * 1024)}MB.`
      );
    }

    let content = await fs.promises.readFile(resolvedPath, "utf-8");

    if (previewLines && previewLines > 0) {
      const lines = content.split("\n");
      content = lines.slice(0, previewLines).join("\n");
    }

    return content;
  }

  async readBinaryFile(filePath: string): Promise<Buffer> {
    const resolvedPath = path.resolve(filePath);
    const stats = await fs.promises.stat(resolvedPath);

    if (!stats.isFile()) {
      throw new Error("Path is not a file.");
    }

    if (stats.size > this.maxFileSize) {
      throw new Error(
        `File size exceeds the limit of ${this.maxFileSize / (1024 * 1024)}MB.`
      );
    }

    return await fs.promises.readFile(resolvedPath);
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    if (!this.allowWrite) {
      throw new Error(
        "Writing to files is not allowed. Set ALLOW_WRITE=true in .env to enable."
      );
    }

    const resolvedPath = path.resolve(filePath);

    try {
      const stats = await fs.promises.stat(resolvedPath);
      if (stats.isFile()) {
        const timestamp = new Date().toISOString().replace(/[:.-]/g, "");
        const backupPath = `${resolvedPath}.bak.${timestamp}`;
        await fs.promises.copyFile(resolvedPath, backupPath);
      }
    } catch (error) {}

    await fs.promises.writeFile(resolvedPath, content, "utf-8");
  }

  async deleteFile(filePath: string): Promise<void> {
    if (!this.allowDelete) {
      throw new Error(
        "Deleting files is not allowed. Set ALLOW_DELETE=true in .env to enable."
      );
    }

    const resolvedPath = path.resolve(filePath);
    const stats = await fs.promises.stat(resolvedPath);

    if (!stats.isFile()) {
      throw new Error("Path is not a file.");
    }

    await fs.promises.unlink(resolvedPath);
  }
}
