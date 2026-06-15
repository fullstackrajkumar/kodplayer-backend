import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";
import {
  GCS_ALLOWED_CONTENT_TYPES,
  GCS_MAX_FILENAME_LENGTH,
  GCS_MAX_UPLOAD_BYTES_MAX,
} from "../constants";

/**
 * Body for `POST /uploads/signed-url`. The caller proposes a folder + filename + content type;
 * the server validates against an allow-list, generates a random object key, and signs a v4 URL.
 *
 * `folder` is validated against a per-controller allow-list (admin vs public app), so it is
 * left as a free string here and checked in the controller layer.
 */
export class CreateSignedUploadUrlDto {
  @ApiProperty({
    description:
      "Logical destination folder (e.g. 'menu-items', 'branding', 'users', 'reviews'). Must be in the per-route allow-list.",
    example: "menu-items",
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  folder!: string;

  @ApiProperty({
    description:
      "Original filename from the client. Used only to derive an extension and a sanitized suffix; the actual stored key is randomized.",
    example: "pepperoni-original.jpg",
    maxLength: GCS_MAX_FILENAME_LENGTH,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(GCS_MAX_FILENAME_LENGTH)
  fileName!: string;

  @ApiProperty({
    description: "MIME type of the file. Must be in the allow-list. This value is signed; the client must send the same Content-Type when uploading.",
    enum: GCS_ALLOWED_CONTENT_TYPES,
    example: "image/jpeg",
  })
  @IsString()
  @IsIn(GCS_ALLOWED_CONTENT_TYPES as unknown as string[])
  contentType!: string;

  @ApiPropertyOptional({
    description:
      "Optional declared file size in bytes. If provided, server will reject when over the configured cap; the cap is also enforced server-side by GCS via signed `x-goog-content-length-range`.",
    minimum: 1,
    maximum: GCS_MAX_UPLOAD_BYTES_MAX,
    example: 524288,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  fileSize?: number;
}

/** Headers the client MUST send when PUTing to the signed URL. */
export class SignedUploadHeadersDto {
  @ApiProperty({ example: "image/jpeg" })
  "Content-Type"!: string;

  // @ApiProperty({
  //   example: "0-10485760",
  //   description:
  //     "Signed size cap (`<min>-<max>` bytes). The client must send this header verbatim or GCS will reject the upload.",
  // })
  // "x-goog-content-length-range"!: string;
}

export class SignedUploadUrlResponseDto {
  @ApiProperty({
    description:
      "Short-lived signed URL. PUT the file body here. Treat as a credential — do not log, do not share.",
    example:
      "https://storage.googleapis.com/your-app-name/menu-items/abc.jpg?X-Goog-Algorithm=...",
  })
  uploadUrl!: string;

  @ApiProperty({
    description: "HTTP method the signed URL is valid for. Always 'PUT'.",
    example: "PUT",
  })
  method!: "PUT";

  @ApiProperty({
    description: "Headers the client MUST send when uploading. Anything extra/different breaks the signature.",
    type: SignedUploadHeadersDto,
  })
  headers!: SignedUploadHeadersDto;

  @ApiProperty({
    description: "Final public URL to persist on the related entity (e.g. menuItem.imageUrl). Available only AFTER successful upload.",
    example:
      "https://storage.googleapis.com/your-app-name/menu-items/3f.../pepperoni-original.jpg",
  })
  publicUrl!: string;

  @ApiProperty({
    description: "Object key inside the bucket — useful if you ever need to delete or reference the object directly.",
    example: "menu-items/3fa85f64-5717-4562-b3fc-2c963f66afa6/pepperoni-original.jpg",
  })
  objectKey!: string;

  @ApiProperty({
    description: "ISO timestamp when this signed URL stops working.",
    example: "2026-05-15T17:35:00.000Z",
  })
  expiresAt!: string;

  @ApiProperty({
    description: "Maximum upload bytes accepted by GCS for this URL.",
    example: 10485760,
  })
  maxBytes!: number;
}
