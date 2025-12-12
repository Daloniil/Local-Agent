import { z } from "zod";
import { FilesystemService } from "../../filesystem/filesystem.service";

export const filesystemLLMTools = (filesystemService: FilesystemService) => ({
  read_text_file: {
    description:
      "Read the complete contents of a file from the file system as text. " +
      "Handles various text encodings and provides detailed error messages " +
      "if the file cannot be read. Use this tool when you need to examine " +
      "the contents of a single file. Use the 'head' parameter to read only " +
      "the first N lines of a file, or the 'tail' parameter to read only " +
      "the last N lines of a file. Operates on the file as text regardless of extension. " +
      "Only works within allowed directories.",
    inputSchema: z.object({
      path: z.string(),
      tail: z
        .number()
        .optional()
        .describe("If provided, returns only the last N lines of the file"),
      head: z
        .number()
        .optional()
        .describe("If provided, returns only the first N lines of a file"),
    }),
    execute: async ({ path, head, tail }) => {
      let content = "";
      if (head) {
        content = await filesystemService.headFile(path, head);
      } else if (tail) {
        content = await filesystemService.tailFile(path, tail);
      } else {
        content = await filesystemService.readFileContent(path);
      }
      await filesystemService.setFileResult(content);
      return content;
    },
  },
  read_media_file: {
    description:
      "Read an image or audio file. Returns the base64 encoded data and MIME type. " +
      "Only works within allowed directories.",
    inputSchema: z.object({
      path: z.string(),
    }),
    execute: async ({ path }) => {
      return filesystemService.readFileAsBase64Stream(path);
    },
  },
  write_file: {
    description:
      "Create a new file or completely overwrite an existing file with new content. " +
      "Use with caution as it will overwrite existing files without warning. " +
      "Handles text content with proper encoding. Only works within allowed directories.",
    inputSchema: z.object({
      path: z.string(),
      content: z.string(),
    }),
    execute: async ({ path, content }) => {
      await filesystemService.writeFileContent(path, content);
      return `Successfully wrote to ${path}`;
    },
  },
  edit_file: {
    description:
      "Make line-based edits to a text file. Each edit replaces exact line sequences " +
      "with new content. Returns a git-style diff showing the changes made. " +
      "Only works within allowed directories.",
    inputSchema: z.object({
      path: z.string(),
      edits: z.array(z.object({ oldText: z.string(), newText: z.string() })),
      dryRun: z
        .boolean()
        .optional()
        .default(false)
        .describe("Preview changes using git-style diff format"),
    }),
    execute: async ({ path, edits, dryRun }) => {
      return filesystemService.applyFileEdits(path, edits, dryRun);
    },
  },
  create_directory: {
    description:
      "Create a new directory or ensure a directory exists. Can create multiple " +
      "nested directories in one operation. If the directory already exists, " +
      "this operation will succeed silently. Perfect for setting up directory " +
      "structures for projects or ensuring required paths exist. Only works within allowed directories.",
    inputSchema: z.object({
      path: z.string(),
    }),
    execute: async ({ path }) => {
      await filesystemService.createDirectory(path);
      return `Successfully created directory ${path}`;
    },
  },
  list_directory: {
    description:
      "Get a detailed listing of all files and directories in a specified path. " +
      "Results clearly distinguish between files and directories with [FILE] and [DIR] " +
      "prefixes. This tool is essential for understanding directory structure and " +
      "finding specific files within a directory. Only works within allowed directories.",
    inputSchema: z.object({
      path: z.string(),
    }),
    execute: async ({ path }) => {
      return filesystemService.listDirectory(path);
    },
  },
  directory_tree: {
    description:
      "Get a recursive tree view of files and directories as a JSON structure. " +
      "Each entry includes 'name', 'type' (file/directory), and 'children' for directories. " +
      "Files have no children array, while directories always have a children array (which may be empty). " +
      "The output is formatted with 2-space indentation for readability. Only works within allowed directories.",
    inputSchema: z.object({
      path: z.string(),
      excludePatterns: z.array(z.string()).optional().default([]),
    }),
    execute: async ({ path, excludePatterns }) => {
      return filesystemService.directoryTree(path, excludePatterns);
    },
  },
  move_file: {
    description:
      "Move or rename files and directories. Can move files between directories " +
      "and rename them in a single operation. If the destination exists, the " +
      "operation will fail. Works across different directories and can be used " +
      "for simple renaming within the same directory. Both source and destination must be within allowed directories.",
    inputSchema: z.object({
      source: z.string(),
      destination: z.string(),
    }),
    execute: async ({ source, destination }) => {
      await filesystemService.moveFile(source, destination);
      return `Successfully moved ${source} to ${destination}`;
    },
  },
  search_files: {
    description:
      "Recursively search for files and directories matching a pattern. " +
      "The patterns should be glob-style patterns that match paths relative to the working directory. " +
      "Use pattern like '*.ext' to match files in current directory, and '**/*.ext' to match files in all subdirectories. " +
      "Returns full paths to all matching items. Great for finding files when you don't know their exact location. " +
      "Only searches within allowed directories.",
    inputSchema: z.object({
      path: z.string(),
      pattern: z.string(),
      excludePatterns: z.array(z.string()).optional().default([]),
    }),
    execute: async ({ path, pattern, excludePatterns }) => {
      return filesystemService.searchFiles(path, pattern, { excludePatterns });
    },
  },
  get_file_info: {
    description:
      "Retrieve detailed metadata about a file or directory. Returns comprehensive " +
      "information including size, creation time, last modified time, permissions, " +
      "and type. This tool is perfect for understanding file characteristics " +
      "without reading the actual content. Only works within allowed directories.",
    inputSchema: z.object({
      path: z.string(),
    }),
    execute: async ({ path }) => {
      return filesystemService.getFileStats(path);
    },
  },
});
