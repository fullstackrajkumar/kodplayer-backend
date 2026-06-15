import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { UserDbService } from "@mbt/api-common";
import { RegisterUserDto, UpdateProfileDto } from "../dto/user.dto";

@Injectable()
export class UsersService {
  constructor(private readonly userDb: UserDbService) {}

  async getProfile(userId: string): Promise<unknown> {
    const u = await this.userDb.findByUserId(userId);
    if (!u) throw new NotFoundException("User not found");
    return u;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<unknown> {
    if (dto.email) {
      const other = await this.userDb.findOne({
        email: dto.email.toLowerCase(),
        userId: { $ne: userId },
      } as never);
      if (other) {
        throw new ConflictException("Email already in use");
      }
    }
    const { phoneNumber: _omitPhone, ...profileFields } = dto;
    void _omitPhone;
    const updated = await this.userDb.updateByUserId(userId, {
      $set: { ...profileFields, ...(dto.email ? { email: dto.email.toLowerCase() } : {}) },
    } as never);
    if (!updated) throw new NotFoundException("User not found");
    const out = updated as unknown as Record<string, unknown>;
    delete out.deletedAt;
    delete out.deletedBy;
    delete out.updatedAt;
    delete out.__v;
    delete out._id;
    return out;
  }
}
