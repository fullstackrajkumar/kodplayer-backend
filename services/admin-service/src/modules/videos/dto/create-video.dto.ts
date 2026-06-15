import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateVideoDto {
  @ApiProperty({ description: "Title of the video" })
  @IsNotEmpty()
  @IsString()
  title!: string;

  @ApiProperty({ description: "Description of the video", required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: "Thumbnail image URL", required: false })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;
}
