import { Injectable } from "@nestjs/common";
import * as fsLib from "./lib";
import * as fs from "fs"; // For fs.promises and createReadStream
import path from "path"; // For path.join
import { minimatch } from "minimatch"; // For searchFilesWithValidation
import { searchFilesWithValidation } from "./lib";

@Injectable()
export class FilesystemService {
  private allowedDirectories: string[] = [];
  private fileResult: string = "";

  constructor() {}

  async validatePath(requestedPath: string): Promise<string> {
    return fsLib.validatePath(requestedPath);
  }

  async getFileStats(filePath: string): Promise<any> {
    const validPath = await this.validatePath(filePath);
    return fsLib.getFileStats(validPath);
  }

  async setFileResult(result: string): Promise<void> {
    this.fileResult = result;
  }

  async getFileResult(): Promise<string> {
    return this.fileResult;
  }

  async readFileContent(
    filePath: string,
    encoding: string = "utf-8"
  ): Promise<string> {
    const validPath = await this.validatePath(filePath);
    return fsLib.readFileContent(validPath, encoding);
  }

  async writeFileContent(filePath: string, content: string): Promise<void> {
    const validPath = await this.validatePath(filePath);
    await fsLib.writeFileContent(validPath, content);
  }

  async applyFileEdits(
    filePath: string,
    edits: any[],
    dryRun: boolean = false
  ): Promise<string> {
    const validPath = await this.validatePath(filePath);
    return fsLib.applyFileEdits(validPath, edits, dryRun);
  }

  async tailFile(filePath: string, numLines: number): Promise<string> {
    const validPath = await this.validatePath(filePath);
    return fsLib.tailFile(validPath, numLines);
  }

  async headFile(filePath: string, numLines: number): Promise<string> {
    const validPath = await this.validatePath(filePath);
    return fsLib.headFile(validPath, numLines);
  }

  async searchFiles(
    rootPath: string,
    pattern: string,
    options: any = {}
  ): Promise<string[]> {
    const validPath = await this.validatePath(rootPath);
    return searchFilesWithValidation(
      validPath,
      pattern,
      this.allowedDirectories,
      options
    );
  }

  async createDirectory(dirPath: string): Promise<void> {
    const validPath = await this.validatePath(dirPath);
    await fs.promises.mkdir(validPath, { recursive: true });
  }

  async listDirectory(dirPath: string): Promise<string[]> {
    const validPath = await this.validatePath(dirPath);
    const entries = await fs.promises.readdir(validPath, {
      withFileTypes: true,
    });
    return entries.map(
      (entry) => `${entry.isDirectory() ? "[DIR]" : "[FILE]"} ${entry.name}`
    );
  }

  async directoryTree(
    dirPath: string,
    excludePatterns: string[] = []
  ): Promise<any> {
    const rootPath = await this.validatePath(dirPath);

    interface TreeEntry {
      name: string;
      type: "file" | "directory";
      children?: TreeEntry[];
    }

    async function buildTree(
      currentPath: string,
      excludePatterns: string[] = []
    ): Promise<TreeEntry[]> {
      const validPath = await fsLib.validatePath(currentPath);
      const entries = await fs.promises.readdir(validPath, {
        withFileTypes: true,
      });
      const result: TreeEntry[] = [];

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        const relativePath = path.relative(rootPath, fullPath);
        const shouldExclude = excludePatterns.some((pattern) =>
          minimatch(relativePath, pattern, { dot: true })
        );
        if (shouldExclude) continue;

        const entryData: TreeEntry = {
          name: entry.name,
          type: entry.isDirectory() ? "directory" : "file",
        };

        if (entry.isDirectory()) {
          const subPath = path.join(currentPath, entry.name);
          entryData.children = await buildTree(subPath, excludePatterns);
        }

        result.push(entryData);
      }
      return result;
    }
    const treeData = await buildTree(rootPath, excludePatterns);
    return JSON.stringify(treeData, null, 2);
  }

  async moveFile(source: string, destination: string): Promise<void> {
    const validSourcePath = await this.validatePath(source);
    const validDestPath = await this.validatePath(destination);
    await fs.promises.rename(validSourcePath, validDestPath);
  }

  async readFileAsBase64Stream(filePath: string): Promise<string> {
    const validPath = await this.validatePath(filePath);
    return new Promise((resolve, reject) => {
      const stream = fs.createReadStream(validPath);
      const chunks: Buffer[] = [];
      stream.on("data", (chunk) => {
        chunks.push(chunk as Buffer);
      });
      stream.on("end", () => {
        const finalBuffer = Buffer.concat(chunks);
        resolve(finalBuffer.toString("base64"));
      });
      stream.on("error", (err) => reject(err));
    });
  }
}
