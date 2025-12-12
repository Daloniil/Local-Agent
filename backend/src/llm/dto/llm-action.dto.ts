import { IsString, IsNotEmpty, IsOptional, IsIn } from "class-validator";

export class LlmActionDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(["read", "list", "write", "delete"])
  action: "read" | "list" | "write" | "delete";

  @IsString()
  @IsNotEmpty()
  path: string;

  @IsOptional()
  args?: any;
}
